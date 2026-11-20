#!/usr/bin/env python3
"""Train a baseline gaze-estimation model on UnityEyes-style synthetic eye data.

Manifest CSV required columns: image_path, gaze_pitch, gaze_yaw (radians, consistent convention).
UnityEyes distributions vary; convert provided gaze labels (e.g. look vectors) to pitch/yaw as needed
and document the convention in provenance.

Research experiment only - not a clinical tool.
"""
from __future__ import annotations

import argparse
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
    return (data_root / p).resolve()


class GazeDataset(Dataset):
    def __init__(self, image_paths: List[Path], targets: np.ndarray, transform=None):
        self.image_paths = image_paths
        self.targets = torch.tensor(targets, dtype=torch.float32)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int):
        with Image.open(self.image_paths[idx]) as img:
            img = img.convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, self.targets[idx]


def build_model(name: str, pretrained: bool) -> nn.Module:
    weights = "DEFAULT" if pretrained else None
    name = name.lower()
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
    pitch, yaw = pitch_yaw[:, 0], pitch_yaw[:, 1]
    x = -torch.cos(pitch) * torch.sin(yaw)
    y = -torch.sin(pitch)
    z = -torch.cos(pitch) * torch.cos(yaw)
    v = torch.stack([x, y, z], dim=1)
    return v / (torch.norm(v, dim=1, keepdim=True) + 1e-8)


def angular_error_deg(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    dot = torch.sum(pitchyaw_to_vector(pred) * pitchyaw_to_vector(target), dim=1).clamp(-1.0, 1.0)
    return torch.acos(dot) * (180.0 / math.pi)


def evaluate(model, loader, device, criterion):
    model.eval()
    total_loss = 0.0
    total = 0
    preds_all, targets_all = [], []
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
    mae_p = torch.mean(torch.abs(preds[:, 0] - targets[:, 0])).item() if len(preds) else float("nan")
    mae_y = torch.mean(torch.abs(preds[:, 1] - targets[:, 1])).item() if len(preds) else float("nan")
    ang = angular_error_deg(preds, targets).mean().item() if len(preds) else float("nan")
    return total_loss / max(total, 1), mae_p, mae_y, preds.numpy(), targets.numpy(), ang


def main() -> int:
    ap = argparse.ArgumentParser(description="Train UnityEyes gaze estimation baseline")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--data-root", default=".")
    ap.add_argument("--output-dir", default="runs/unityeyes_exp")
    ap.add_argument("--model", default="resnet18", choices=["resnet18", "resnet34", "mobilenet_v3_small"])
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--batch-size", type=int, default=64)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--weight-decay", type=float, default=1e-4)
    ap.add_argument("--img-size", type=int, default=224)
    ap.add_argument("--val-split", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--num-workers", type=int, default=2)
    ap.add_argument("--pretrained", action="store_true")
    ap.add_argument("--no-pretrained", dest="pretrained", action="store_false")
    ap.set_defaults(pretrained=True)
    ap.add_argument("--max-samples", type=int, default=0)
    args = ap.parse_args()

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

    image_paths = [resolve_image_path(str(p), data_root, manifest_path.parent) for p in df["image_path"]]
    missing = [str(p) for p in image_paths if not p.exists()]
    if missing:
        raise FileNotFoundError(f"{len(missing)} image(s) not found. First: {missing[0]}")
    targets = df[["gaze_pitch", "gaze_yaw"]].to_numpy(dtype=np.float32)

    idx = np.arange(len(df))
    train_idx, val_idx = train_test_split(idx, test_size=args.val_split, random_state=args.seed)

    train_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    train_ds = Subset(GazeDataset(image_paths, targets, train_tf), train_idx.tolist())
    val_ds = Subset(GazeDataset(image_paths, targets, val_tf), val_idx.tolist())

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    pin = device.type == "cuda"
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=pin)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers, pin_memory=pin)

    model = build_model(args.model, args.pretrained).to(device)
    criterion = nn.SmoothL1Loss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=3)

    best_ang = float("inf")
    best_state = best_eval = None
    best_epoch = -1
    history = []

    print(f"Samples: {len(df)} (train {len(train_idx)}, val {len(val_idx)}) | device={device}")
    for epoch in range(1, args.epochs + 1):
        model.train()
        running = n = 0
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
        print(f"Epoch {epoch}/{args.epochs} train_loss={train_loss:.5f} val_ang_err={ang:.3f}°")
        if ang < best_ang:
            best_ang, best_epoch = ang, epoch
            best_state = {k: v.detach().cpu() for k, v in model.state_dict().items()}
            best_eval = (mae_p, mae_y, ang, preds_np, t_np)

    assert best_state and best_eval
    torch.save({"model_name": args.model, "task": "gaze_pitch_yaw_regression", "img_size": args.img_size, "state_dict": best_state, "best_epoch": best_epoch, "best_val_mean_angular_error_deg": best_ang}, out_dir / "best_model.pt")
    mae_p, mae_y, ang, preds_np, t_np = best_eval
    pd.DataFrame({"gaze_pitch_true": t_np[:, 0], "gaze_yaw_true": t_np[:, 1], "gaze_pitch_pred": preds_np[:, 0], "gaze_yaw_pred": preds_np[:, 1]}).to_csv(out_dir / "predictions_val.csv", index=False)
    pd.DataFrame(history).to_csv(out_dir / "history.csv", index=False)
    (out_dir / "metrics.json").write_text(json.dumps({"dataset": {"manifest": str(manifest_path), "samples": len(df)}, "best": {"epoch": best_epoch, "val_mean_angular_error_deg": best_ang, "val_mae_pitch": mae_p, "val_mae_yaw": mae_y}, "config": vars(args), "device": str(device), "timestamp_utc": datetime.now(timezone.utc).isoformat(), "note": "Research experiment only. Synthetic-data results do not transfer directly to real webcam use."}, indent=2, default=str))
    (out_dir / "provenance.json").write_text(json.dumps({"experiment": "unityeyes_gaze_estimation_research", "dataset_name": "UnityEyes (VERIFY exact source/version)", "source_url_or_reference": "https://datasetsearch.research.google.com/ (confirm exact distribution)", "licence_or_terms": "<fill: confirm exact version and underlying asset rights>", "preprocessing": f"manifest-based, resize {args.img_size}, ImageNet norm", "target": "gaze_pitch,gaze_yaw regression", "code_commit": "<fill>", "notes": "Synthetic eyes; validate on real consented data before deployment claims. Do not redistribute data against terms."}, indent=2))
    print(f"Best val mean angular error: {best_ang:.3f} deg (epoch {best_epoch}). Saved to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
