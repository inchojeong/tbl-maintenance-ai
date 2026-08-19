from __future__ import annotations

import json
from pathlib import Path

from app.schemas.diagnosis import DiagnosisResult

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

UNKNOWN = DiagnosisResult(
    system_code="UNKNOWN",
    symptom_code="UNKNOWN",
    risk_level="LOW",
    suspected_components=["UNKNOWN"],
    answer="관련 공개 교범 시나리오를 찾지 못했습니다. 데모 질의 예시를 사용해 주세요.",
    manual_ids=[],
    recommended_steps=["증상 재입력", "데모 질의 예시 사용"],
    view_target_id="AIRCRAFT_OVERVIEW",
    confidence=0.2,
    is_demo=True,
    sources=[],
)


def _load_demo_file() -> list[dict]:
    path = DATA_DIR / "demo_responses.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("responses", [])


def match_demo(query: str) -> DiagnosisResult:
    q = query.strip()
    best: dict | None = None
    best_len = 0
    for item in _load_demo_file():
        keys = list(item.get("keywords", [])) + list(item.get("keywords_alt", []))
        for k in keys:
            if k in q and len(k) > best_len:
                best = item
                best_len = len(k)
    if best is not None:
        return DiagnosisResult(**{**best["response"], "is_demo": True})

    if "오일" in q and ("압력" in q or "경고" in q):
        for item in _load_demo_file():
            if item.get("id") == "DEMO-PUB-ENG-OIL-001":
                return DiagnosisResult(**{**item["response"], "is_demo": True})

    return UNKNOWN.model_copy()
