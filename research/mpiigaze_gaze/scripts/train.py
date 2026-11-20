#!/usr/bin/env python3
"""Train a baseline gaze-estimation model on MPIIGaze-style data (research experiment).

Inputs: a CSV manifest with columns at least: image_path, gaze_pitch, gaze_yaw
(angles in radians, consistent convention). Optional: subject, head_pitch/head_yaw/head_roll.
Because Kaggle MPIIGaze packages vary, prepare the manifest from the dataset's annotations.

The model regresses [gaze_pitch, gaze_yaw]. Default split is random (quick experiments);
for rigorous evaluation use subject-independent / leave-one-subject-out splits.

Not for clinical use.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import models, transforms


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def resolve_image_path(p: str, data_root: Path, manifest_dir: Path) -> Path:
    path = Path(p)
    if path.is_absolute() and path.exists():
        return path
    for base in [data_root, manifest_dir, Path.cwd()]:
        cand = (base / p).resolve()
        if cand.exists():
            return cand
    # try as-is relative
    return (data_root / p).resolve()


class GazeDataset(Dataset):
    def __init__(self, image_paths: List[Path], targets: np.ndarray, transform=None):
        self.image_paths = image_paths
        self.targets = torch.tensor(targets, dtype=torch.float32)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int):
        path = self.image_paths[idx]
        with Image.open(path) as img:
            img = img.convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, self.targets[idx]


def build_model(name: str, pretrained: bool) -> nn.Module:
    name = name.lower()
    weights = "DEFAULT" if pretrained else None
    if name == "resnet18":
        m = models.resnet18(weights=weights)
        m.fc = nn.Linear(m.fc.in_features, 2)
        return m
    if name == "resnet34":
        m = models.resnet34(weights=weights)
        m.fc = nn.Linear(m.fc.in_features, 2)
        return m
    if name == "mobilenet_v3_small":
        m = models.mobilenet_v3_small(weights=weights)
        m.classifier[-1] = nn.Linear(m.classifier[-1].in_features, 2)
        return m
    raise ValueError(f"Unsupported model: {name}")


def pitchyaw_to_vector(pitch_yaw: torch.Tensor) -> torch.Tensor:
    # pitch, yaw -> 3D unit vector (common gaze convention; assumes radians)
    pitch = pitch_yaw[:, 0]
    yaw = pitch_yaw[:, 1]
    x = -torch.cos(pitch) * torch.sin(yaw)
    y = -torch.sin(pitch)
    z = -torch.cos(pitch) * torch.cos(yaw)
    v = torch.stack([x, y, z], dim=1)
    return v / (torch.norm(v, dim=1, keepdim=True) + 1e-8)


def angular_error_deg(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    vp = pitchyaw_to_vector(pred)
    vt = pitchyaw_to_vector(target)
    dot = torch.sum(vp * vt, dim=1).clamp(-1.0, 1.0)
    return torch.acos(dot) * (180.0 / math.pi)


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device, criterion) -> Tuple[float, float, float, np.ndarray, np.ndarray]:
    model.eval()
    total_loss = 0.0
    total = 0
    preds_all = []
    targets_all = []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = criterion(out, y)
            total_loss += loss.item() * x.size(0)
            total += x.size(0)
            preds_all.append(out.cpu())
            targets_all.append(y.cpu())
    preds = torch.cat(preds_all, dim=0) if preds_all else torch.empty((0, 2))
    targets = torch.cat(targets_all, dim=0) if targets_all else torch.empty((0, 2))
    mae_pitch = torch.mean(torch.abs(preds[:, 0] - targets[:, 0])).item() if len(preds) else float("nan")
    mae_yaw = torch.mean(torch.abs(preds[:, 1] - targets[:, 1])).item() if len(preds) else float("nan")
    ang = angular_error_deg(preds, targets).mean().item() if len(preds) else float("nan")
    return total_loss / max(total, 1), mae_pitch, mae_yaw, preds.numpy(), targets.numpy(), ang


def main() -> int:
    p = argparse.ArgumentParser(description="Train MPIIGaze gaze estimation baseline (pitch/yaw regression)")
    p.add_argument("--manifest", required=True, help="CSV with columns: image_path,gaze_pitch,gaze_yaw[,subject,...]")
    p.add_argument("--data-root", default=".", help="Root directory to resolve relative image paths")
    p.add_argument("--output-dir", default="runs/mpiigaze_exp", help="Output directory for model/metrics")
    p.add_argument("--model", default="resnet18", choices=["resnet18", "resnet34", "mobilenet_v3_small"])
    p.add_argument("--epochs", type=int, default=20)
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--weight-decay", type=float, default=1e-4)
    p.add_argument("--img-size", type=int, default=224)
    p.add_argument("--val-split", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--num-workers", type=int, default=2)
    p.add_argument("--pretrained", action="store_true")
    p.add_argument("--no-pretrained", dest="pretrained", action="store_false")
    p.set_defaults(pretrained=True)
    p.add_argument("--max-samples", type=int, default=0, help="Optional cap for quick smoke tests (0 = all)")
    args = p.parse_args()

    set_seed(args.seed)
    manifest_path = Path(args.manifest)
    data_root = Path(args.data_root)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(manifest_path)
    for col in ["image_path", "gaze_pitch", "gaze_yaw"]:
        if col not in df.columns:
            raise ValueError(f"Manifest missing required column: {col}")
    if args.max_samples and len(df) > args.max_samples:
        df = df.sample(n=args.max_samples, random_state=args.seed).reset_index(drop=True)

    image_paths = [resolve_image_path(str(p), data_root, manifest_path.parent) for p in df["image_path"].tolist()]
    missing = [str(p) for p in image_paths if not p.exists()]
    if missing:
        raise FileNotFoundError(f"{len(missing)} image(s) not found. First missing: {missing[0]}")
    targets = df[["gaze_pitch", "gaze_yaw"]].to_numpy(dtype=np.float32)

    idx = np.arange(len(df))
    train_idx, val_idx = train_test_split(idx, test_size=args.val_split, random_state=args.seed)

    train_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    full_train = GazeDataset(image_paths, targets, transform=train_tf)
    full_val = GazeDataset(image_paths, targets, transform=val_tf)
    train_ds = Subset(full_train, train_idx.tolist())
    val_ds = Subset(full_val, val_idx.tolist())

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    pin = device.type == "cuda"
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=pin)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers, pin_memory=pin)

    model = build_model(args.model, pretrained=args.pretrained).to(device)
    criterion = nn.SmoothL1Loss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=3)

    best_ang = float("inf")
    best_epoch = -1
    best_state = None
    best_eval = None
    history = []

    print(f"Samples: {len(df)} (train {len(train_idx)}, val {len(val_idx)}) | device={device} model={args.model}")
    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        n = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()
            running += loss.item() * x.size(0)
            n += x.size(0)
        train_loss = running / max(n, 1)

        val_loss, mae_p, mae_y, preds_np, t_np, ang = evaluate(model, val_loader, device, criterion)
        scheduler.step(ang)
        history.append({"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss, "val_mae_pitch": mae_p, "val_mae_yaw": mae_y, "val_mean_angular_error_deg": ang})
        print(f"Epoch {epoch}/{args.epochs} train_loss={train_loss:.5f} val_loss={val_loss:.5f} val_ang_err={ang:.3f}° mae(p,y)=({mae_p:.4f},{mae_y:.4f})")

        if ang < best_ang:
            best_ang = ang
            best_epoch = epoch
            best_state = {k: v.detach().cpu() for k, v in model.state_dict().items()}
            best_eval = (val_loss, mae_p, mae_y, ang, preds_np, t_np)

    assert best_state is not None and best_eval is not None
    torch.save({
        "model_name": args.model,
        "task": "gaze_pitch_yaw_regression",
        "img_size": args.img_size,
        "state_dict": best_state,
        "best_epoch": best_epoch,
        "best_val_mean_angular_error_deg": best_ang,
    }, out_dir / "best_model.pt")

    _, mae_p, mae_y, ang, preds_np, t_np = best_eval
    pred_df = pd.DataFrame({
        "gaze_pitch_true": t_np[:, 0], "gaze_yaw_true": t_np[:, 1],
        "gaze_pitch_pred": preds_np[:, 0], "gaze_yaw_pred": preds_np[:, 1],
    })
    pred_df.to_csv(out_dir / "predictions_val.csv", index=False)
    pd.DataFrame(history).to_csv(out_dir / "history.csv", index=False)

    metrics = {
        "dataset": {"manifest": str(manifest_path), "data_root": str(data_root), "samples": len(df)},
        "split": {"train": int(len(train_idx)), "val": int(len(val_idx)), "val_split": args.val_split, "seed": args.seed, "note": "random split; use subject-independent splits for rigorous MPIIGaze evaluation"},
        "config": {"model": args.model, "pretrained": args.pretrained, "epochs": args.epochs, "batch_size": args.batch_size, "lr": args.lr, "img_size": args.img_size},
        "best": {"epoch": best_epoch, "val_mean_angular_error_deg": best_ang, "val_mae_pitch": mae_p, "val_mae_yaw": mae_y},
        "device": str(device),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "note": "Research experiment only. Not a clinical gaze assessment and not part of NeuLens screening outputs.",
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    provenance = {
        "experiment": "mpiigaze_gaze_estimation_research",
        "dataset_name": "MPIIGaze (Kaggle package - VERIFY exact slug/release)",
        "dataset_slug": "<fill: owner/slug>",
        "dataset_version_or_access_date": "<fill>",
        "licence_or_terms": "<fill: MPIIGaze/Kaggle terms as accepted; cite MPIIGaze as required>",
        "preprocessing": f"manifest-based load, resize {args.img_size}x{args.img_size}, ImageNet norm, random val split {args.val_split}",
        "target": "gaze_pitch,gaze_yaw regression (radians, convention per manifest)",
        "model": f"{args.model} pretrained={args.pretrained}",
        "code_commit": "<fill>",
        "notes": "For rigorous results use subject-independent evaluation. Do not redistribute raw data.",
    }
    (out_dir / "provenance.json").write_text(json.dumps(provenance, indent=2))

    print(f"\nBest val mean angular error: {best_ang:.3f} deg (epoch {best_epoch})")
    print(f"Saved: {out_dir / 'best_model.pt'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
