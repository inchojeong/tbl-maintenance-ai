# Public technical manual page images (Hybrid)

Internal note for Demo: page images are rendered from publicly available CH-47D TM PDFs.
They do not represent Surion / classified manuals.

Generate (dev machine):

```bash
pip install -r scripts/requirements-manual-pages.txt
python scripts/generate_manual_pages.py \
  --pdf "/path/to/TM_55-1520-240-T-2.pdf" \
  --page 114 \
  --out frontend/public/manual-pages/T2_p114.webp
```

`--page` is **1-based** (same as `pdf_page` in JSON).
