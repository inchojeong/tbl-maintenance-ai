"""Tests for maintenance history similarity (prototype dummy data)."""

from __future__ import annotations

from app.db import init_db
from app.schemas.maintenance import MaintenanceHistoryCreate
from app.services import maintenance_history_service as mh


def setup_module():
    init_db()


def test_seed_and_list():
    items = mh.list_history(aircraft_id="AC-001", limit=200)
    assert len(items) >= 20


def test_similar_oil_pressure():
    items = mh.search_similar(
        aircraft_id="AC-001",
        symptom_code="ENG_OIL_PRESS_LOW",
        system_code="ENGINE_OIL",
        symptom="엔진오일 압력 저하",
        detected_value="31 PSI",
        top_k=5,
    )
    assert len(items) >= 3
    assert items[0].similarity_percent >= 50


def test_similar_hydraulic():
    items = mh.search_similar(
        aircraft_id="AC-001",
        symptom_code="HYD_PRESS_LOW",
        system_code="HYDRAULIC",
        symptom="유압 압력",
        top_k=5,
    )
    assert len(items) >= 3


def test_similar_generator():
    items = mh.search_similar(
        aircraft_id="AC-001",
        symptom_code="GEN_OFF",
        system_code="ELECTRICAL",
        symptom="발전기",
        top_k=5,
    )
    assert len(items) >= 3


def test_create_and_find():
    created = mh.create_history(
        MaintenanceHistoryCreate(
            aircraft_id="AC-001",
            symptom="엔진오일 압력 저하 테스트등록",
            root_cause="시연용 원인",
            maintenance_action="시연용 조치",
            maintenance_result="시연용 결과",
            symptom_code="ENG_OIL_PRESS_LOW",
            system_code="ENGINE_OIL",
            fault_code="ENG-OIL-P-01",
            system_category="Engine Oil System",
            detected_value="31 PSI",
        )
    )
    assert created.maintenance_id
    again = mh.search_similar(
        aircraft_id="AC-001",
        symptom_code="ENG_OIL_PRESS_LOW",
        symptom="테스트등록",
        top_k=5,
    )
    ids = {x.record.maintenance_id for x in again}
    assert created.maintenance_id in ids or any(
        "테스트등록" in x.record.symptom for x in again
    )
