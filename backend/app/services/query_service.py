from __future__ import annotations

from app.schemas.diagnosis import DiagnosisResult, QueryRequest
from app.services.demo_service import match_demo
from app.services.llm_service import try_llm_diagnosis
from app.services.rag_service import search_manuals


async def run_query(req: QueryRequest) -> DiagnosisResult:
    manuals = search_manuals(q=req.query, system_code=None, top_k=3)

    if req.demo_mode:
        return match_demo(req.query)

    llm = await try_llm_diagnosis(req.query, manuals)
    if llm is not None:
        return llm

    return match_demo(req.query)
