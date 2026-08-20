from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.db import get_conn
from app.schemas.diagnosis import (
    DemoResetRequest,
    DiagnosisResult,
    MaintenanceResultRequest,
    QueryRequest,
)
from app.schemas.maintenance import MaintenanceHistoryCreate
from app.services import maintenance_history_service as mh
from app.services.query_service import run_query
from app.services.rag_service import search_failures, search_manuals

router = APIRouter(prefix="/api")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@router.get("/health")
def health():
    return {"status": "ok", "service": "marine-ai-maintenance"}


@router.post("/query", response_model=DiagnosisResult)
async def query(req: QueryRequest):
    if len(req.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="질의가 너무 짧습니다.", headers={"X-Error-Code": "VALIDATION_ERROR"})
    return await run_query(req)


@router.post("/query/voice")
async def query_voice():
    return JSONResponse(
        status_code=501,
        content={
            "detail": "음성 API는 다음 단계에서 구현됩니다. 텍스트 질의를 사용하세요.",
            "code": "NOT_IMPLEMENTED",
        },
    )


@router.post("/query/image")
async def query_image():
    return JSONResponse(
        status_code=501,
        content={
            "detail": "이미지 API는 다음 단계에서 구현됩니다. 텍스트 질의를 사용하세요.",
            "code": "NOT_IMPLEMENTED",
        },
    )


@router.get("/manual/search")
def manual_search(
    q: str = "",
    system_code: str | None = None,
    top_k: int = Query(default=5, ge=1, le=20),
):
    items = search_manuals(q=q, system_code=system_code, top_k=top_k)
    return {"items": items}


@router.get("/failures/search")
def failures_search(
    q: str = "",
    symptom_code: str | None = None,
    top_k: int = Query(default=5, ge=1, le=20),
):
    items = search_failures(symptom_code=symptom_code, q=q, top_k=top_k)
    return {"items": items}


@router.get("/phm/{aircraft_id}")
def phm(aircraft_id: str):
    path = DATA_DIR / "phm_demo.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="PHM 데이터가 없습니다.")
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("aircraft_id") != aircraft_id and aircraft_id not in (
        "DEMO-KUH-01",
        "AC-001",
    ):
        raise HTTPException(status_code=404, detail="항공기를 찾을 수 없습니다.", headers={"X-Error-Code": "AIRCRAFT_NOT_FOUND"})
    return data


@router.get("/3d/map/{view_target_id}")
def map_view_target(view_target_id: str):
    path = DATA_DIR / "view_targets.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    targets = data.get("targets", {})
    if view_target_id not in targets:
        raise HTTPException(
            status_code=404,
            detail="view_target_id가 없습니다.",
            headers={"X-Error-Code": "VIEW_TARGET_NOT_FOUND"},
        )
    return targets[view_target_id]


@router.post("/maintenance/result", status_code=201)
def save_maintenance(req: MaintenanceResultRequest):
    """Legacy short-form save — also writes into maintenance_history."""
    mid = f"MR-{uuid.uuid4().hex[:8]}"
    created = datetime.now(timezone.utc).isoformat()
    conn = get_conn()
    conn.execute(
        "INSERT INTO maintenance_result (id, aircraft_id, actions, parts_used, outcome, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (mid, req.aircraft_id, req.actions, req.parts_used, req.outcome, created),
    )
    conn.commit()
    conn.close()
    # Mirror into rich history store for similar-case search
    try:
        mh.create_history(
            MaintenanceHistoryCreate(
                aircraft_id=req.aircraft_id,
                symptom=req.actions[:80] or "정비 조치",
                root_cause=req.actions,
                maintenance_action=req.actions,
                replaced_part=req.parts_used,
                maintenance_result=req.outcome,
                diagnosis=req.actions,
                system_category="Engine Oil System",
                severity="Warning",
            )
        )
    except Exception:
        pass
    return {"id": mid, "saved": True}


@router.get("/aircraft")
def aircraft_list():
    return {"items": [a.model_dump() for a in mh.list_aircraft()]}


@router.get("/aircraft/{aircraft_id}")
def aircraft_get(aircraft_id: str):
    a = mh.get_aircraft(aircraft_id)
    if not a:
        raise HTTPException(status_code=404, detail="항공기를 찾을 수 없습니다.")
    stats = mh.history_stats(aircraft_id)
    return {**a.model_dump(), "maintenance_count": stats.total}


@router.get("/maintenance-history")
def maintenance_history_list(
    aircraft_id: str | None = None,
    system_category: str | None = None,
    component: str | None = None,
    fault_code: str | None = None,
    symptom: str | None = None,
    maintenance_result: str | None = None,
    severity: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
):
    items = mh.list_history(
        aircraft_id=aircraft_id,
        system_category=system_category,
        component=component,
        fault_code=fault_code,
        symptom=symptom,
        maintenance_result=maintenance_result,
        severity=severity,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )
    return {"items": [i.model_dump() for i in items]}


@router.get("/maintenance-history/stats")
def maintenance_history_stats(aircraft_id: str | None = None):
    return mh.history_stats(aircraft_id).model_dump()


@router.get("/maintenance-history/similar")
def maintenance_history_similar(
    aircraft_id: str | None = None,
    symptom_code: str | None = None,
    system_code: str | None = None,
    fault_code: str | None = None,
    symptom: str | None = None,
    diagnosis: str | None = None,
    component: str | None = None,
    detected_value: str | None = None,
    top_k: int = Query(default=5, ge=1, le=20),
):
    items = mh.search_similar(
        aircraft_id=aircraft_id,
        symptom_code=symptom_code,
        system_code=system_code,
        fault_code=fault_code,
        symptom=symptom,
        diagnosis=diagnosis,
        component=component,
        detected_value=detected_value,
        top_k=top_k,
    )
    return {"items": [i.model_dump() for i in items]}


@router.get("/maintenance-history/{maintenance_id}")
def maintenance_history_get(maintenance_id: str):
    item = mh.get_history(maintenance_id)
    if not item:
        raise HTTPException(status_code=404, detail="정비이력을 찾을 수 없습니다.")
    return item.model_dump()


@router.post("/maintenance-history", status_code=201)
def maintenance_history_create(body: MaintenanceHistoryCreate):
    created = mh.create_history(body)
    return created.model_dump()


@router.post("/demo/reset")
def demo_reset(req: DemoResetRequest):
    conn = get_conn()
    if req.aircraft_id:
        conn.execute(
            "DELETE FROM maintenance_result WHERE aircraft_id = ?",
            (req.aircraft_id,),
        )
        # Only delete non-dummy user-added history for this aircraft
        aid = "AC-001" if req.aircraft_id == "DEMO-KUH-01" else req.aircraft_id
        conn.execute(
            "DELETE FROM maintenance_history WHERE aircraft_id = ? AND is_dummy = 0",
            (aid,),
        )
    else:
        conn.execute("DELETE FROM maintenance_result")
        conn.execute("DELETE FROM maintenance_history WHERE is_dummy = 0")
    conn.commit()
    conn.close()
    return {"ok": True}
