"""Optional OpenAI LLM. Without API key, callers use demo_service."""

from __future__ import annotations

import json
import os
from typing import Any

from app.schemas.diagnosis import ALLOWED_VIEW_TARGETS, DiagnosisResult


async def try_llm_diagnosis(query: str, manuals: list[dict]) -> DiagnosisResult | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        import urllib.request

        system = (
            "You are a Korean-speaking aircraft maintenance support AI for a DEMO "
            "using PUBLIC CH-47D US Army TM 55-1520-240-T excerpts only. "
            "NOT Surion (수리온) procedures. "
            "Return ONLY JSON with keys: system_code, symptom_code, risk_level, "
            "suspected_components, answer, manual_ids, recommended_steps, "
            "view_target_id, confidence, is_demo, sources, td_grade. "
            "sources is an array of {manual_id,document_id,title,page,pdf_page,task,paragraph}. "
            f"view_target_id must be one of {sorted(ALLOWED_VIEW_TARGETS)}. is_demo=false. "
            "Cite only manuals provided in the user payload; do not invent procedures or pages. "
            "answer must be natural Korean spoken to a maintainer: start with a direct judgment, "
            "then priority checks, then next checks if the fault persists, then "
            "'관련 장비' or '관련 계통' with human-readable names (never raw codes like "
            "HYDRAULIC_ZONE, ENG_OIL_PRESS_LOW, PRESSURE_SENSOR), then "
            "'정비교범 근거' with TM · Task · PDF page, then '3D 위치' sentence, then DEMO disclaimer. "
            "Do not dump English cause lists or chain many Task numbers in the answer body. "
            "Keep numeric limits from the provided manuals unchanged (e.g. 20 psi, 2500–3500 psi). "
            "suspected_components may keep internal codes for mapping; answer text must use labels."
        )
        user = json.dumps({"query": query, "manuals": manuals[:3]}, ensure_ascii=False)
        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload: dict[str, Any] = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        data = json.loads(content)
        data["is_demo"] = False
        result = DiagnosisResult.model_validate(data)
        result.assert_view_target_allowed()
        return result
    except Exception:
        return None
