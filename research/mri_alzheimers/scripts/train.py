#!/usr/bin/env python3
"""Train a 4-class Alzheimer's MRI image classifier (research experiment only).

- Expects an image-folder dataset with 4 classes (e.g. NonDemented, VeryMildDemented,
  MildDemented, ModerateDemented). Handles common Kaggle layouts by auto-detecting class dirs.
- Performs a stratified train/val split when no explicit split is provided.
- Saves best checkpoint and evaluation artifacts.

Not for clinical use. Record dataset provenance and licence in the output provenance.json.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import models, transforms

CLASS_CANONICAL = ["NonDemented", "VeryMildDemented", "MildDemented", "ModerateDemented"]
CLASS_ALIASES = {
    "nondemented": "NonDemented",
    "non_demented": "NonDemented",
    "non-demented": "NonDemented",
    "noimpairment": "NonDemented",
    "verymilddemented": "VeryMildDemented",
    "very_mild_demented": "VeryMildDemented",
    "very-mild-demented": "VeryMildDemented",
    "verymilddementia": "VeryMildDemented",
    "milddemented": "MildDemented",
    "mild_demented": "MildDemented",
    "mild-demented": "MildDemented",
    "milddementia": "MildDemented",
    "moderatedemented": "ModerateDemented",
    "moderate_demented": "ModerateDemented",
    "moderate-demented": "ModerateDemented",
    "moderatedementia": "ModerateDemented",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def normalize_class_name(name: str) -> str | None:
    key = "".join(ch for ch in name.lower() if ch.isalnum())
    # try direct and underscore-ish forms
    if key in CLASS_ALIASES:
        return CLASS_ALIASES[key]
    key2 = name.lower().replace(" ", "").replace("_", "").replace("-", "")
    return CLASS_ALIASES.get(key2)


def find_class_root(data_dir: Path) -> Path:
    """Find a directory whose immediate subdirs look like the 4 target classes."""
    candidates = [data_dir] + [p for p in data_dir.rglob("*") if p.is_dir()]
    for cand in candidates:
        subs = [d for d in cand.iterdir() if d.is_dir()]
        mapped = [normalize_class_name(d.name) for d in subs]
        hits = [m for m in mapped if m in CLASS_CANONICAL]
        if len(set(hits)) == 4:
            return cand
    # fallback: if exactly 4 subdirs total, accept
    subs = [d for d in data_dir.iterdir() if d.is_dir()]
    if len(subs) == 4:
        return data_dir
    raise FileNotFoundError(
        f"Could not locate 4 class folders under {data_dir}. "
        "Expected folders like NonDemented/VeryMildDemented/MildDemented/ModerateDemented."
    )


class MRIDataset(Dataset):
    def __init__(self, samples: Sequence[Tuple[Path, int]], transform=None):
        self.samples = list(samples)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        with Image.open(path) as img:
            img = img.convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


def collect_samples(class_root: Path, class_to_idx: Dict[str, int]) -> List[Tuple[Path, int]]:
    samples: List[Tuple[Path, int]] = []
    for sub in sorted([d for d in class_root.iterdir() if d.is_dir()]):
        cls = normalize_class_name(sub.name)
        if cls is None or cls not in class_to_idx:
            # allow already-canonical names
            if sub.name in class_to_idx:
                cls = sub.name
            else:
                continue
        label = class_to_idx[cls]
        for p in sub.rglob("*"):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                samples.append((p, label))
    if not samples:
        raise RuntimeError(f"No images found under {class_root}")
    return samples


def build_model(name: str, num_classes: int, pretrained: bool) -> nn.Module:
    name = name.lower()
    weights = "DEFAULT" if pretrained else None
    if name == "resnet18":
        m = models.resnet18(weights=weights)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
        return m
    if name == "resnet50":
        m = models.resnet50(weights=weights)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
        return m
    if name == "mobilenet_v3_small":
        m = models.mobilenet_v3_small(weights=weights)
        m.classifier[-1] = nn.Linear(m.classifier[-1].in_features, num_classes)
        return m
    raise ValueError(f"Unsupported model: {name}")


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device, criterion) -> Tuple[float, float, List[int], List[int]]:
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    y_true: List[int] = []
    y_pred: List[int] = []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = criterion(logits, y)
            total_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=1)
            correct += (preds == y).sum().item()
            total += x.size(0)
            y_true.extend(y.cpu().tolist())
            y_pred.extend(preds.cpu().tolist())
    avg_loss = total_loss / max(total, 1)
    acc = correct / max(total, 1)
    return avg_loss, acc, y_true, y_pred


def main() -> int:
    p = argparse.ArgumentParser(description="Train Alzheimer's MRI 4-class classifier (research)")
    p.add_argument("--data-dir", required=True, help="Path to dataset root or folder containing 4 class subfolders")
    p.add_argument("--output-dir", default="runs/exp1", help="Directory to save checkpoints/metrics")
    p.add_argument("--model", default="resnet18", choices=["resnet18", "resnet50", "mobilenet_v3_small"])
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--weight-decay", type=float, default=1e-4)
    p.add_argument("--img-size", type=int, default=224)
    p.add_argument("--val-split", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--num-workers", type=int, default=2)
    p.add_argument("--pretrained", action="store_true", help="Use ImageNet-pretrained weights")
    p.add_argument("--no-pretrained", dest="pretrained", action="store_false")
    p.set_defaults(pretrained=True)
    p.add_argument("--max-samples", type=int, default=0, help="Optional cap for quick smoke tests (0 = all)")
    args = p.parse_args()

    set_seed(args.seed)
    data_dir = Path(args.data_dir)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    class_root = find_class_root(data_dir)
    class_to_idx = {c: i for i, c in enumerate(CLASS_CANONICAL)}
    samples = collect_samples(class_root, class_to_idx)
    if args.max_samples and len(samples) > args.max_samples:
        rng = random.Random(args.seed)
        samples = rng.sample(samples, args.max_samples)

    labels = [y for _, y in samples]
    counts = Counter(labels)
    print(f"Class root: {class_root}")
    print(f"Total samples: {len(samples)}")
    for i, name in enumerate(CLASS_CANONICAL):
        print(f"  {i} {name}: {counts.get(i, 0)}")

    train_idx, val_idx = train_test_split(
        list(range(len(samples))),
        test_size=args.val_split,
        random_state=args.seed,
        stratify=labels if len(set(labels)) > 1 else None,
    )

    train_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    full_train = MRIDataset(samples, transform=train_tf)
    full_val = MRIDataset(samples, transform=val_tf)
    train_ds = Subset(full_train, train_idx)
    val_ds = Subset(full_val, val_idx)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    pin = device.type == "cuda"
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=pin)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers, pin_memory=pin)

    model = build_model(args.model, num_classes=len(CLASS_CANONICAL), pretrained=args.pretrained).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)

    best_acc = -1.0
    best_epoch = -1
    history_rows = []
    best_state = None
    best_val = None

    print(f"Device: {device} | model={args.model} pretrained={args.pretrained}")
    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        correct = 0
        total = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            running += loss.item() * x.size(0)
            correct += (logits.argmax(1) == y).sum().item()
            total += x.size(0)
        train_loss = running / max(total, 1)
        train_acc = correct / max(total, 1)

        val_loss, val_acc, y_true, y_pred = evaluate(model, val_loader, device, criterion)
        scheduler.step(val_acc)
        history_rows.append({"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc, "val_loss": val_loss, "val_acc": val_acc})
        print(f"Epoch {epoch}/{args.epochs} - train_loss={train_loss:.4f} train_acc={train_acc:.4f} val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

        if val_acc > best_acc:
            best_acc = val_acc
            best_epoch = epoch
            best_state = {k: v.detach().cpu() for k, v in model.state_dict().items()}
            best_val = (val_loss, val_acc, y_true, y_pred)

    assert best_state is not None and best_val is not None
    ckpt_path = out_dir / "best_model.pt"
    torch.save({
        "model_name": args.model,
        "num_classes": len(CLASS_CANONICAL),
        "class_names": CLASS_CANONICAL,
        "img_size": args.img_size,
        "state_dict": best_state,
        "best_epoch": best_epoch,
        "best_val_acc": best_acc,
    }, ckpt_path)

    _, _, y_true, y_pred = best_val
    report = classification_report(y_true, y_pred, target_names=CLASS_CANONICAL, digits=4, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(CLASS_CANONICAL))))

    (out_dir / "classification_report.txt").write_text(report)
    np.savetxt(out_dir / "confusion_matrix.csv", cm, delimiter=",", fmt="%d")
    with (out_dir / "history.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["epoch", "train_loss", "train_acc", "val_loss", "val_acc"])
        w.writeheader()
        w.writerows(history_rows)

    metrics = {
        "dataset": {"data_dir": str(data_dir), "class_root": str(class_root), "total_samples": len(samples), "class_counts": {CLASS_CANONICAL[i]: counts.get(i, 0) for i in range(len(CLASS_CANONICAL))}},
        "split": {"train": len(train_idx), "val": len(val_idx), "val_split": args.val_split, "seed": args.seed},
        "config": {"model": args.model, "pretrained": args.pretrained, "epochs": args.epochs, "batch_size": args.batch_size, "lr": args.lr, "weight_decay": args.weight_decay, "img_size": args.img_size},
        "best": {"epoch": best_epoch, "val_acc": best_acc},
        "device": str(device),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "note": "Research experiment only. Not a clinical/diagnostic model and not part of NeuLens screening outputs.",
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    provenance = {
        "experiment": "alzheimers_mri_4class_research",
        "dataset_name": "Alzheimer's MRI Dataset (Kaggle) - VERIFY exact title/slug/release",
        "dataset_slug": "<fill: e.g. sachinpatel21/azheimer-mri-dataset>",
        "dataset_version_or_access_date": "<fill>",
        "licence_or_terms": "<fill: Kaggle dataset licence/terms as accepted>",
        "permitted_use": "<fill: research/competition/etc per terms>",
        "preprocessing": f"resize {args.img_size}x{args.img_size}, ImageNet norm, basic train augments, stratified val split {args.val_split}",
        "feature_or_model_version": f"{args.model} pretrained={args.pretrained}",
        "code_commit": "<fill: git commit or 'no-git'>",
        "output_dir": str(out_dir.resolve()),
        "notes": "Do not redistribute raw images. Do not use for clinical claims.",
    }
    (out_dir / "provenance.json").write_text(json.dumps(provenance, indent=2))

    print("\nBest validation accuracy:", best_acc)
    print("Saved:", ckpt_path)
    print("Report:\n", report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
