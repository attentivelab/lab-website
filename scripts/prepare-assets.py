#!/usr/bin/env python3
"""Convert source images in pictures/ to web-ready WebP in public/images/."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pictures"
OUT = ROOT / "public" / "images"

JOBS = [
    ("Icon_lab.png", "logo", 320, True),
    ("Fiave et al., 2026.png", "hero-fiave-2026", 1600, True),
    ("Lab_Picture.jpg", "lab-team", 1200, False),
]


def convert(src_name, stem, max_w, alpha):
    src = SRC / src_name
    if not src.exists():
        raise SystemExit(f"missing source image: {src}")
    im = Image.open(src)
    im = im.convert("RGBA" if alpha else "RGB")
    if alpha:
        bbox = im.getchannel("A").getbbox()
        if bbox:
            im = im.crop(bbox)  # trim transparent padding
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    dest = OUT / f"{stem}.webp"
    im.save(dest, "WEBP", quality=88, method=6)
    print(f"{src_name:30} -> {dest.name:22} {im.width}x{im.height}  {dest.stat().st_size/1024:6.1f} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        convert(*job)
    unige = SRC / "Logo_UNIGE.webp"
    if unige.exists():
        (OUT / "logo-unige.webp").write_bytes(unige.read_bytes())
        print(f"{'Logo_UNIGE.webp':30} -> logo-unige.webp (copied)")
    # publication PDFs: papers/ at repo root is the source of truth.
    # Served at /pdfs/ (NOT /papers/): Astro's dev route guard 404s any
    # browser navigation whose URL path shadows a file at the repo root,
    # and papers/<name>.pdf exists there.
    papers_out = ROOT / "public" / "pdfs"
    papers_out.mkdir(parents=True, exist_ok=True)
    for pdf in sorted((ROOT / "papers").glob("*.pdf")):
        (papers_out / pdf.name).write_bytes(pdf.read_bytes())
        print(f"{pdf.name:30} -> public/pdfs/ (copied)")


if __name__ == "__main__":
    main()
