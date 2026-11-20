#!/usr/bin/env python3
"""Predict/evaluate gaze (pitch,yaw) using a trained UnityEyes checkpoint (research only)."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torchvision import transforms

from train import angular_error_deg, build_model, resolve_image_path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--checkpoint", required=True)
    p.add_argument("--manifest", required=True)
    p.add_argument("--data-root", default=".")
    p.add_argument("--output", default="")
    p.add_argument("--img-size", type=int, default=0)
    args = p.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(Path(args.checkpoint), map_location=device)
    model = build_model(ckpt.get("model_name", "resnet18"), pretrained=False)
    model.load_state_dict(ckpt["state_dict"])
    model.to(device).eval()
    img_size = args.img_size or int(ckpt.get("img_size", 224))
    tf = transforms.Compose([transforms.Resize((img_size, img_size)), transforms.ToTensor(), transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])

    df = pd.read_csv(args.manifest)
    manifest_dir, data_root = Path(args.manifest).parent, Path(args.data_root)
    preds = []
    for pth in df["image_path"].tolist():
        with Image.open(resolve_image_path(str(pth), data_root, manifest_dir)) as img:
            x = tf(img.convert("RGB")).unsqueeze(0).to(device)
        with torch.no_grad():
            out = model(x).cpu()[0]
        preds.append([float(out[0]), float(out[1])])
    pred_arr = np.array(preds, dtype=np.float32)
    out_df = df.copy()
    out_df["gaze_pitch_pred"] = pred_arr[:, 0]
    out_df["gaze_yaw_pred"] = pred_arr[:, 1]
    if "gaze_pitch" in df.columns and "gaze_yaw" in df.columns:
        ang = angular_error_deg(torch.tensor(pred_arr), torch.tensor(df[["gaze_pitch", "gaze_yaw"]].to_numpy(dtype=np.float32)))
        out_df["angular_error_deg"] = ang.numpy()
        print(f"Mean angular error: {ang.mean().item():.3f} deg | median: {ang.median().item():.3f} deg")
    if args.output:
        out_df.to_csv(args.output, index=False)
        print(f"Saved: {args.output}")
    else:
        print(out_df.head(10).to_string(index=False))
    print("Research experiment only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
