#!/usr/bin/env python3
"""
Generate WebP page images from a technical-manual PDF.

CLI (1-based PDF page index):
  python scripts/generate_manual_pages.py \\
    --pdf path/to/TM.pdf --page 114 --out frontend/public/manual-pages/T2_p114.webp

Notes:
  - Input --page is 1-based (PDF Viewer / project pdf_page convention).
  - Renderers use 0-based indices internally.
  - Prefers PyMuPDF (fitz); falls back to pypdfium2 if fitz DLL is unavailable.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def render_pymupdf(pdf: Path, page_1based: int, out: Path, width_px: int, quality: int) -> None:
    import fitz  # type: ignore

    doc = fitz.open(pdf)
    try:
        idx = page_1based - 1
        if idx < 0 or idx >= doc.page_count:
            raise SystemExit(
                f"page {page_1based} out of range (1..{doc.page_count})"
            )
        page = doc.load_page(idx)
        # Target ~width_px wide; keep aspect
        zoom = width_px / float(page.rect.width)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out.parent.mkdir(parents=True, exist_ok=True)
        # Write PNG then convert via Pillow for WebP quality control
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(pix.tobytes("png")))
        h = img.height
        if h < 1800 or h > 2600:
            # normalize height into recommended band
            target_h = 2200
            scale = target_h / h
            img = img.resize(
                (max(1, int(img.width * scale)), target_h),
                Image.Resampling.LANCZOS,
            )
        img.save(out, "WEBP", quality=quality, method=6)
    finally:
        doc.close()


def render_pypdfium2(pdf: Path, page_1based: int, out: Path, width_px: int, quality: int) -> None:
    import pypdfium2 as pdfium
    from PIL import Image

    doc = pdfium.PdfDocument(str(pdf))
    try:
        idx = page_1based - 1
        n = len(doc)
        if idx < 0 or idx >= n:
            raise SystemExit(f"page {page_1based} out of range (1..{n})")
        page = doc[idx]
        # scale so width ~= width_px
        w_pt = page.get_width()
        scale = width_px / float(w_pt)
        bitmap = page.render(scale=scale)
        img = bitmap.to_pil()
        h = img.height
        if h < 1800 or h > 2600:
            target_h = 2200
            s = target_h / h
            img = img.resize(
                (max(1, int(img.width * s)), target_h),
                Image.Resampling.LANCZOS,
            )
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out, "WEBP", quality=quality, method=6)
    finally:
        doc.close()


def main() -> int:
    ap = argparse.ArgumentParser(description="PDF page → WebP (1-based page index)")
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--page", required=True, type=int, help="1-based PDF page index")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--width", type=int, default=1600, help="render width in pixels")
    ap.add_argument("--quality", type=int, default=90, help="WebP quality 1-100")
    args = ap.parse_args()

    if not args.pdf.is_file():
        raise SystemExit(f"PDF not found: {args.pdf}")
    if args.page < 1:
        raise SystemExit("--page must be >= 1 (1-based)")

    try:
        import fitz  # noqa: F401

        render_pymupdf(args.pdf, args.page, args.out, args.width, args.quality)
        engine = "pymupdf"
    except Exception as exc:
        print(f"[warn] PyMuPDF unavailable ({exc}); using pypdfium2", file=sys.stderr)
        render_pypdfium2(args.pdf, args.page, args.out, args.width, args.quality)
        engine = "pypdfium2"

    size_kb = args.out.stat().st_size / 1024
    print(f"OK [{engine}] page={args.page} -> {args.out} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
