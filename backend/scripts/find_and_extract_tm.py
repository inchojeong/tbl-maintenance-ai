# -*- coding: utf-8 -*-
"""Scan public CH-47 TM PDFs (pdfplumber/pypdf) for PoC scenario pages."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

TOPIC_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("oil_pressure", re.compile(r"oil\s+pressure\s+(low|high|warning|indication|gage|gauge)", re.I)),
    ("oil_filter", re.compile(r"oil\s+filter", re.I)),
    ("hydraulic_pressure", re.compile(r"hydraulic\s+pressure\s+(low|high|loss)", re.I)),
    ("generator", re.compile(r"(generator\s+fail|ac\s+generator|generator\s+caution)", re.I)),
    ("xmsn_oil_temp", re.compile(r"(transmission|xmsn).{0,30}(oil\s+temp|temperature\s+high)", re.I)),
]

STRUCT_HINTS = re.compile(
    r"(possible\s+cause|corrective\s+action|malfunction|symptom|procedure|troubleshooting|fault\s+isolation)",
    re.I,
)


def find_pdf_dir() -> Path:
    hits = list(ROOT.rglob("TM_55-1520-240-T-1.pdf"))
    if not hits:
        raise FileNotFoundError(f"T-1 not under {ROOT}")
    return hits[0].parent


def page_text(pdf_path: Path, page_index: int) -> str:
    import pdfplumber

    with pdfplumber.open(pdf_path) as pdf:
        if page_index >= len(pdf.pages):
            return ""
        return pdf.pages[page_index].extract_text() or ""


def scan_pdf(pdf_path: Path, max_pages: int | None = None) -> list[dict]:
    import pdfplumber

    matches: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        n = len(pdf.pages) if max_pages is None else min(len(pdf.pages), max_pages)
        print(f"  {pdf_path.name}: {n}/{len(pdf.pages)} pages", flush=True)
        for i in range(n):
            if i % 50 == 0:
                print(f"    … page {i+1}", flush=True)
            text = pdf.pages[i].extract_text() or ""
            if len(text) < 60:
                continue
            topics = [name for name, rx in TOPIC_PATTERNS if rx.search(text)]
            if not topics:
                continue
            struct = bool(STRUCT_HINTS.search(text))
            # printed page near footer/header
            printed = None
            m = re.search(r"55-1520-240-T-\d+[^\n]*?(\d{1,4})\s*$", text, re.M)
            if m:
                printed = int(m.group(1))
            else:
                nums = re.findall(r"\b(\d{2,4})\b", text[-120:])
                if nums:
                    printed = int(nums[-1])
            snippet = re.sub(r"\s+", " ", text).strip()
            matches.append(
                {
                    "file": pdf_path.name,
                    "pdf_page_index": i,
                    "pdf_page_human": i + 1,
                    "printed_page_guess": printed,
                    "topics": topics,
                    "has_struct": struct,
                    "snippet": snippet[:1800],
                    "full_len": len(text),
                }
            )
    return matches


def main() -> int:
    pdf_dir = find_pdf_dir()
    print(f"PDF_DIR={pdf_dir}", flush=True)

    # Prefer troubleshooting volumes
    targets = [
        pdf_dir / "TM_55-1520-240-T-1.pdf",
        pdf_dir / "TM_55-1520-240-T-2.pdf",
        pdf_dir / "TM_55-1520-240-T-3.pdf",
    ]
    all_matches: list[dict] = []
    for p in targets:
        if not p.exists():
            print(f"MISSING {p.name}")
            continue
        all_matches.extend(scan_pdf(p))

    # Prefer structured troubleshooting pages
    all_matches.sort(
        key=lambda m: (
            -int(m["has_struct"]),
            -len(m["topics"]),
            m["file"],
            m["pdf_page_index"],
        )
    )
    out = {"pdf_dir": str(pdf_dir), "match_count": len(all_matches), "matches": all_matches}
    out_path = Path(__file__).resolve().parent / "_tm_scan_results.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"WROTE {out_path} count={len(all_matches)}", flush=True)

    # Topic best picks
    for topic, _ in TOPIC_PATTERNS:
        best = [m for m in all_matches if topic in m["topics"] and m["has_struct"]][:5]
        if not best:
            best = [m for m in all_matches if topic in m["topics"]][:5]
        print(f"\n=== TOPIC {topic} ({len(best)}) ===")
        for m in best:
            print(
                f"{m['file']} idx={m['pdf_page_human']} printed~{m['printed_page_guess']} struct={m['has_struct']}"
            )
            print(m["snippet"][:350])
            print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
