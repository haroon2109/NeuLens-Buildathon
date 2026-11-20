#!/usr/bin/env python3
"""Run inference with a trained Alzheimer's MRI classifier checkpoint (research only)."""
from __future__ import annotations

import argparse
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from train import CLASS_CANONICAL, build_model, collect_samples, find_class_root


def load_checkpoint(path: Path, device: torch.device):
    ckpt = torch.load(path, map_location=device)
    model = build_model(ckpt.get("model_name", "resnet18"), num_classes=ckpt.get("num_classes", 4), pretrained=False)
    model.load_state_dict(ckpt["state_dict"])
    model.to(device).eval()
    return ckpt, model


def main() -> int:
    p = argparse.ArgumentParser(description="Predict MRI classes from a folder using a trained checkpoint")
    p.add_argument("--checkpoint", required=True, help="Path to best_model.pt")
    p.add_argument("--data-dir", required=True, help="Folder containing class subfolders or images to sample-evaluate")
    p.add_argument("--img-size", type=int, default=0, help="Override image size (default: from checkpoint)")
    args = p.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt, model = load_checkpoint(Path(args.checkpoint), device)
    img_size = args.img_size or int(ckpt.get("img_size", 224))
    class_names = ckpt.get("class_names", CLASS_CANONICAL)

    tf = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    data_dir = Path(args.data_dir)
    # Try labeled evaluation if class folders found
    try:
        class_root = find_class_root(data_dir)
        class_to_idx = {c: i for i, c in enumerate(class_names)}
        samples = collect_samples(class_root, class_to_idx)
        correct = 0
        for path, label in samples:
            with Image.open(path) as img:
                x = tf(img.convert("RGB")).unsqueeze(0).to(device)
            with torch.no_grad():
                pred = model(x).argmax(1).item()
            correct += int(pred == label)
        acc = correct / max(len(samples), 1)
        print(f"Labeled samples: {len(samples)} | accuracy: {acc:.4f}")
    except Exception:
        # Unlabeled: predict each image file directly under data_dir
        imgs = [p for p in data_dir.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}]
        for path in imgs[:50]:
            with Image.open(path) as img:
                x = tf(img.convert("RGB")).unsqueeze(0).to(device)
            with torch.no_grad():
                probs = torch.softmax(model(x), dim=1)[0]
                pred = int(probs.argmax().item())
            print(f"{path}: {class_names[pred]} ({probs[pred]:.3f})")
        if len(imgs) > 50:
            print(f"... ({len(imgs)-50} more)")

    print("Note: research experiment only, not a clinical/diagnostic output.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
