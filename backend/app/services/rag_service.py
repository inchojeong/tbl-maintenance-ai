"""Keyword RAG stub with KO↔EN synonym expansion. ChromaDB can replace later."""

from __future__ import annotations

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Minimal query normalization for Korean demo queries → English TM terms.
_SYNONYMS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"오일\s*압력|오일압력"), "oil pressure"),
    (re.compile(r"엔진\s*오일|엔진오일"), "engine oil"),
    (re.compile(r"오일\s*필터|필터\s*오염|필터"), "oil filter"),
    (re.compile(r"오일\s*온도|오일온도"), "oil temperature"),
    (re.compile(r"유압|하이드로릭"), "hydraulic pressure"),
    (re.compile(r"발전기|제너레이터"), "generator"),
    (re.compile(r"배터리|정류기|DC\s*전원"), "battery DC power RECT OFF"),
    (re.compile(r"변속기|변속\s*오일|XMSN"), "transmission XMSN oil"),
    (re.compile(r"오일\s*온도|고온"), "oil temperature hot XMSN OIL HOT"),
    (re.compile(r"칩|CHIP"), "chip detector"),
    (re.compile(r"연료량|연료\s*게이지"), "fuel quantity"),
    (re.compile(r"연료\s*펌프|부스트"), "fuel boost pump"),
    (re.compile(r"연료"), "fuel"),
    (re.compile(r"전기"), "electrical"),
    (re.compile(r"경고등|경고"), "warning capsule indicator"),
    (re.compile(r"1번\s*엔진|1\s*번\s*엔진"), "No. 1 engine"),
    (re.compile(r"차단기"), "circuit breaker"),
]


def normalize_query(q: str) -> str:
    text = q.strip()
    extras: list[str] = []
    for rx, en in _SYNONYMS:
        if rx.search(text):
            extras.append(en)
    if extras:
        return f"{text} {' '.join(extras)}"
    return text


def _load_manuals() -> list[dict]:
    path = DATA_DIR / "dummy_manual.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("chunks", [])


def _chunk_haystack(c: dict) -> str:
    parts = [
        c.get("title", ""),
        c.get("content", ""),
        c.get("original_text", ""),
        c.get("symptom_ko", ""),
        c.get("symptom_en", ""),
        c.get("system_code", ""),
        c.get("subsystem", ""),
        c.get("source_manual", ""),
        c.get("paragraph", ""),
        " ".join(c.get("symptom_codes") or []),
        " ".join(c.get("component_codes") or []),
        " ".join(c.get("possible_causes") or []),
        " ".join(c.get("recommended_steps") or []),
        " ".join(c.get("keywords") or []),
        " ".join(c.get("warning_cautions") or []),
    ]
    return " ".join(parts).lower()


def _score_chunk(ql: str, c: dict) -> float:
    text = _chunk_haystack(c)
    score = 0.0
    tokens = [t for t in re.split(r"[\s·,/]+", ql.lower()) if len(t) >= 2]
    for token in tokens:
        if token in text:
            score += 1.0
    # Boost exact symptom / component hits
    for code in c.get("symptom_codes") or []:
        if code.lower() in ql.lower():
            score += 2.0
    for code in c.get("component_codes") or []:
        if code.lower() in ql.lower():
            score += 1.5
    return score


def search_manuals(
    q: str = "",
    system_code: str | None = None,
    top_k: int = 5,
) -> list[dict]:
    # Future: ChromaDB collection.query(...)
    chunks = _load_manuals()
    qn = normalize_query(q)
    scored: list[tuple[float, dict]] = []
    for c in chunks:
        if system_code and c.get("system_code") != system_code:
            continue
        score = _score_chunk(qn, c)
        if system_code and c.get("system_code") == system_code:
            score += 0.5
        if score > 0 or (system_code and not q):
            item = {
                "id": c["id"],
                "document_id": c.get("document_id", c["id"]),
                "title": c["title"],
                "chapter": c.get("chapter", ""),
                "section": c.get("section", ""),
                "page": c.get("page", 0),
                "paragraph": c.get("paragraph"),
                "content": c.get("content", ""),
                "original_text": c.get("original_text"),
                "system_code": c.get("system_code", ""),
                "source_manual": c.get("source_manual"),
                "symptom_ko": c.get("symptom_ko"),
                "symptom_en": c.get("symptom_en"),
                "possible_causes": c.get("possible_causes") or [],
                "recommended_steps": c.get("recommended_steps") or [],
                "component_codes": c.get("component_codes") or [],
                "is_dummy": c.get("is_dummy", True),
                "is_demo_public_tm": c.get("is_demo_public_tm", False),
                "td_mapping": c.get("td_mapping"),
                "score": score,
            }
            scored.append((score, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored and system_code:
        for c in chunks:
            if c.get("system_code") == system_code:
                scored.append(
                    (
                        0.1,
                        {
                            "id": c["id"],
                            "document_id": c.get("document_id", c["id"]),
                            "title": c["title"],
                            "chapter": c.get("chapter", ""),
                            "section": c.get("section", ""),
                            "page": c.get("page", 0),
                            "paragraph": c.get("paragraph"),
                            "content": c.get("content", ""),
                            "original_text": c.get("original_text"),
                            "system_code": c.get("system_code", ""),
                            "source_manual": c.get("source_manual"),
                            "is_dummy": c.get("is_dummy", True),
                            "is_demo_public_tm": c.get("is_demo_public_tm", False),
                            "score": 0.1,
                        },
                    )
                )
    return [x[1] for x in scored[:top_k]]


def search_failures(
    symptom_code: str | None = None, q: str = "", top_k: int = 5
) -> list[dict]:
    path = DATA_DIR / "failures.json"
    items = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for f in items:
        if symptom_code and f.get("symptom_code") == symptom_code:
            out.append(_fail_item(f))
        elif q and q.lower() in json.dumps(f, ensure_ascii=False).lower():
            out.append(_fail_item(f))
    return out[:top_k]


def _fail_item(f: dict) -> dict:
    return {
        "id": f["id"],
        "symptom": f["symptom"],
        "cause": f["cause"],
        "actions": f["actions"],
        "result": f["result"],
        "similarity": f.get("similarity", 0.0),
        "is_dummy": f.get("is_dummy", True),
    }
