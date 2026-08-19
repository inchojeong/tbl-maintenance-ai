from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.db import init_db
from app.main import app
from app.schemas.diagnosis import DiagnosisResult
from app.services.demo_service import match_demo


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


def test_health(client: TestClient):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_demo_query(client: TestClient):
    r = client.post(
        "/api/query",
        json={
            "aircraft_id": "DEMO-KUH-01",
            "query": "1번 엔진 오일 압력 경고가 발생했는데 어디를 확인해야 해?",
            "demo_mode": True,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["system_code"] == "ENGINE_OIL"
    assert data["symptom_code"] == "ENG_OIL_PRESS_LOW"
    assert data["view_target_id"] == "ENGINE_PRESSURE_SENSOR"
    assert data["is_demo"] is True
    assert data["sources"]
    assert data["sources"][0]["manual_id"] == "TM 55-1520-240-T-2"
    assert data["sources"][0]["page"] == 114
    DiagnosisResult.model_validate(data)


def test_manual_search_public_tm(client: TestClient):
    r = client.get("/api/manual/search", params={"q": "오일 압력", "top_k": 3})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items
    assert items[0]["id"] == "CH47-TM-T2-ENG-OIL-001"
    assert items[0]["source_manual"] == "TM 55-1520-240-T-2"
    assert items[0]["page"] == 114


def test_unknown_query_fallback(client: TestClient):
    r = client.post(
        "/api/query",
        json={"aircraft_id": "DEMO-KUH-01", "query": "완전 무관한 문장 xyz", "demo_mode": True},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["system_code"] == "UNKNOWN"
    assert data["view_target_id"] == "AIRCRAFT_OVERVIEW"


def test_pydantic_validation():
    result = match_demo("오일 압력이 낮아")
    result.assert_view_target_allowed()
    assert result.confidence <= 1.0


def test_missing_view_target(client: TestClient):
    r = client.get("/api/3d/map/DOES_NOT_EXIST")
    assert r.status_code == 404


def test_phm(client: TestClient):
    r = client.get("/api/phm/DEMO-KUH-01")
    assert r.status_code == 200
    assert r.json()["is_dummy"] is True
    assert r.json()["oil_pressure_psi"] == 28
