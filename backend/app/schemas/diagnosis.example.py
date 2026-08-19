"""EXAMPLE Pydantic schemas for diagnosis API.

Copy into backend/app/schemas/diagnosis.py when implementing.
Do not treat values as real maintenance data.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SystemCode = Literal[
    "ENGINE_OIL",
    "ENGINE_COOLING",
    "LANDING_GEAR",
    "MAIN_ROTOR",
    "UNKNOWN",
]

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

ComponentCode = Literal[
    "OIL_FILTER",
    "OIL_PUMP",
    "PRESSURE_SENSOR",
    "ACCESS_PANEL",
    "UNKNOWN",
]

ALLOWED_VIEW_TARGETS = {
    "AIRCRAFT_OVERVIEW",
    "ENGINE_OIL_SYSTEM",
    "ENGINE_OIL_INTERNAL",
    "ENGINE_OIL_FILTER",
    "ENGINE_OIL_PUMP",
    "ENGINE_PRESSURE_SENSOR",
}


class QueryRequest(BaseModel):
    aircraft_id: str = Field(examples=["DEMO-KUH-01"])
    query: str = Field(min_length=2, max_length=500)
    demo_mode: bool = False


class DiagnosisResult(BaseModel):
    system_code: SystemCode
    symptom_code: str
    risk_level: RiskLevel
    suspected_components: list[str]
    answer: str
    manual_ids: list[str]
    recommended_steps: list[str]
    view_target_id: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_demo: bool = False

    def assert_view_target_allowed(self) -> None:
        if self.view_target_id not in ALLOWED_VIEW_TARGETS:
            raise ValueError(f"view_target_id not allowed: {self.view_target_id}")


# Example payload for DEMO-OIL-001
EXAMPLE_DIAGNOSIS = DiagnosisResult(
    system_code="ENGINE_OIL",
    symptom_code="LOW_OIL_PRESSURE",
    risk_level="HIGH",
    suspected_components=["OIL_FILTER", "OIL_PUMP", "PRESSURE_SENSOR"],
    answer=(
        "엔진 오일 압력 저하 및 경고등 점등으로 판단됩니다. "
        "더미 교범에 따라 오일 필터를 우선 점검하십시오."
    ),
    manual_ids=["DUMMY-TM-ENG-03-P15", "DUMMY-TM-ENG-03-P28"],
    recommended_steps=[
        "안전조치 및 경고계통 확인",
        "오일 레벨·누유 육안점검",
        "오일 필터 차압 확인 및 교체",
        "지상가동 후 압력 회복 확인",
        "정비결과 등록",
    ],
    view_target_id="ENGINE_OIL_SYSTEM",
    confidence=0.94,
    is_demo=True,
)
