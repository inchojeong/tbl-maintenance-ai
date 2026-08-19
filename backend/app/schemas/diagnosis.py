"""Pydantic schemas for diagnosis API. Derived from diagnosis.example.py."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


SystemCode = Literal[
    "ENGINE_OIL",
    "ENGINE_COOLING",
    "LANDING_GEAR",
    "MAIN_ROTOR",
    "HYDRAULIC",
    "ELECTRICAL",
    "DRIVE_SYSTEM",
    "FUEL",
    "UNKNOWN",
]

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

ALLOWED_VIEW_TARGETS = {
    "AIRCRAFT_OVERVIEW",
    "ENGINE_OIL_SYSTEM",
    "ENGINE_ACCESS_PANEL",
    "ENGINE_INTERNAL_VIEW",
    "ENGINE_OIL_INTERNAL",
    "ENGINE_OIL_FILTER",
    "ENGINE_OIL_PUMP",
    "ENGINE_PRESSURE_SENSOR",
    "HYDRAULIC_SYSTEM",
    "ELECTRICAL_SYSTEM",
    "DRIVE_SYSTEM_VIEW",
    "FUEL_SYSTEM_VIEW",
}


class QueryRequest(BaseModel):
    aircraft_id: str = Field(examples=["DEMO-KUH-01"])
    query: str = Field(min_length=2, max_length=500)
    demo_mode: bool = False


class SourceRef(BaseModel):
    """Public TM citation for DEMO / Public Technical Manual Reference."""

    manual_id: str
    document_id: str
    title: str
    """Compat: same as pdf_page (1-based local PDF index)."""
    page: int | None = None
    """1-based page index in the local PDF file (not the printed page)."""
    pdf_page: int | None = None
    """Task / procedure id from the manual (e.g. 8-3.3)."""
    task: str | None = None
    """Legacy alias for task."""
    paragraph: str | None = None
    """Printed page if verified in PDF footer; never estimated."""
    printed_page: int | None = None

    @model_validator(mode="after")
    def sync_page_fields(self) -> SourceRef:
        if self.pdf_page is None and self.page is not None:
            self.pdf_page = self.page
        if self.page is None and self.pdf_page is not None:
            self.page = self.pdf_page
        if self.task is None and self.paragraph is not None:
            self.task = self.paragraph
        if self.paragraph is None and self.task is not None:
            self.paragraph = self.task
        return self


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
    sources: list[SourceRef] = Field(default_factory=list)
    fault_code: str | None = None
    area_id: str | None = None
    target_mesh: str | None = None
    cover_mesh: str | None = None
    inspection_point: str | None = None
    td_grade: str | None = None

    def assert_view_target_allowed(self) -> None:
        if self.view_target_id not in ALLOWED_VIEW_TARGETS:
            raise ValueError(f"view_target_id not allowed: {self.view_target_id}")


class MaintenanceResultRequest(BaseModel):
    aircraft_id: str
    actions: str
    parts_used: str | None = None
    outcome: str
    query_id: str | None = None


class DemoResetRequest(BaseModel):
    aircraft_id: str | None = "DEMO-KUH-01"
