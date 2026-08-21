#!/usr/bin/env python3
"""Convert source images in pictures/ to web-ready WebP in public/images/."""
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pictures"
OUT = ROOT / "public" / "images"

JOBS = [
    ("Icon_lab.png", "logo", 320, True),
    ("Fiave et al., 2026.png", "hero-fiave-2026", 1600, True),
    ("Sani_et_al_2021.png", "hero-sani-2021", 1600, True),
    ("Lab_Picture.jpg", "lab-team", 1200, False),
    ("Featured_publication.png", "featured-publication", 1400, False),
    ("Participate/main_Information.png", "participate-hero", 1200, False),
    ("Research/Brain_Injury_Attention.png", "research-page-injury", 1100, False),
    ("Research/Attention_Networks.png", "research-page-networks", 1100, False),
    ("Research/Human_Attention.png", "research-page-everyday", 1100, False),
    ("Research/Neuronal_Mechanims.png", "research-page-neurons", 1100, False),
    ("Participate/mri_study.png", "study-fmri", 900, False),
    ("Participate/tms_study.png", "study-tms", 900, False),
    ("Participate/vr_study.png", "study-vr", 900, False),
    # research area cards (flattened to RGB on white)
    ("Brain Injury & Attention.png", "research-injury", 900, False),
    ("Brain Network of Attention.png", "research-networks", 900, False),
    ("Attention in Everyday Life.png", "research-everyday", 900, False),
    ("Neuronal Mechanisms of Attention.png", "research-neurons", 900, False),
]


def convert(src_name, stem, max_w, alpha):
    src = SRC / src_name
    if not src.exists():
        raise SystemExit(f"missing source image: {src}")
    im = Image.open(src)
    if alpha:
        im = im.convert("RGBA")
    else:
        # flatten possible transparency onto white before dropping alpha
        if im.mode in ("RGBA", "LA", "P"):
            rgba = im.convert("RGBA")
            base = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
            base.alpha_composite(rgba)
            im = base.convert("RGB")
        else:
            im = im.convert("RGB")
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


# Lab member portraits: pictures/lab_members/<file> -> public/images/people-<slug>.webp
# HEIC sources are converted via macOS `sips` (lossless PNG intermediate), then
# encoded to WebP at quality 95 to preserve photographic detail.
MEMBERS = [
    ("Ilaria_Sani.jpeg", "ilaria-sani"),
    ("Prosper_Fiave.heic", "prosper-fiave"),
    ("Krys.heic", "krystina-wieczerzak"),
    ("Simona.heic", "simona-vaitekunaite"),
    ("Thibaud_Delavy.jpg", "thibaud-delavy"),
    ("Tristan_Nukman.HEIC", "tristan-nukman", 90),  # EXIF orientation lost via PNG intermediate
    ("Carling.heic", "carling-massel"),
    ("Eugénie_Catlado.png", "eugenie-cataldo"),
]


COLLABORATORS = [
    ("franco-pestilli.png", "franco-pestilli"),
    ("Patrik_Vuilleumier.jpg", "patrik-vuilleumier"),
    ("Roberta_Ronchi.jpg", "roberta-ronchi"),
    ("Winrich_Freiwald.jpg", "winrich-freiwald"),
    ("Micheal_Schmid.jpg", "michael-schmid"),
    ("Sebastien_Ballesta.jpg", "sebastien-ballesta"),
]


def convert_member(src_name, slug, rotate_cw=0, folder="lab_members", prefix="people"):
    src = SRC / folder / src_name
    if not src.exists():
        raise SystemExit(f"missing member photo: {src}")
    if src.suffix.lower() == ".heic":
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = Path(tmp.name)
        subprocess.run(
            ["sips", "-s", "format", "png", str(src), "--out", str(tmp_path)],
            check=True, capture_output=True,
        )
        im = Image.open(tmp_path)
    else:
        tmp_path = None
        im = Image.open(src)
    im = im.convert("RGB")
    if rotate_cw:
        im = im.rotate(-rotate_cw, expand=True)
    if im.width > 1000:
        h = round(im.height * 1000 / im.width)
        im = im.resize((1000, h), Image.LANCZOS)
    dest = OUT / f"{prefix}-{slug}.webp"
    im.save(dest, "WEBP", quality=95, method=6)
    if tmp_path:
        tmp_path.unlink(missing_ok=True)
    print(f"{src_name:30} -> {dest.name:34} {im.width}x{im.height}  {dest.stat().st_size/1024:6.1f} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        convert(*job)
    for member in MEMBERS:
        convert_member(*member)
    for collab in COLLABORATORS:
        convert_member(*collab, folder="Collaborators", prefix="collab")
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
