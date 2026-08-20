"""Maintenance history schemas. Prototype / fictional data only — not DELIIS."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AircraftInfo(BaseModel):
    aircraft_id: str
    aircraft_type: str
    aircraft_number: str
    total_flight_hours: float
    display_name: str | None = None
    alias_of: str | None = None


class MaintenanceHistoryRecord(BaseModel):
    maintenance_id: str
    aircraft_id: str
    maintenance_date: str
    flight_hours: float = 0.0
    fault_code: str = ""
    system_category: str = ""
    component: str = ""
    symptom: str
    detected_value: str | None = None
    normal_range: str | None = None
    severity: str = "Warning"
    diagnosis: str = ""
    root_cause: str = ""
    maintenance_action: str = ""
    replaced_part: str | None = None
    technician_note: str | None = None
    maintenance_result: str = ""
    recurrence: bool = False
    reference_manual: str | None = None
    symptom_code: str | None = None
    system_code: str | None = None
    created_at: str
    is_dummy: bool = True


class SimilarMaintenanceItem(BaseModel):
    record: MaintenanceHistoryRecord
    similarity: float = Field(ge=0.0, le=1.0)
    similarity_percent: int = Field(ge=0, le=100)


class MaintenanceHistoryCreate(BaseModel):
    aircraft_id: str
    maintenance_date: str | None = None
    flight_hours: float | None = None
    fault_code: str | None = None
    system_category: str | None = None
    component: str | None = None
    symptom: str
    detected_value: str | None = None
    normal_range: str | None = None
    severity: str = "Warning"
    diagnosis: str | None = None
    root_cause: str
    maintenance_action: str
    replaced_part: str | None = None
    technician_note: str | None = None
    maintenance_result: str
    recurrence: bool = False
    reference_manual: str | None = None
    symptom_code: str | None = None
    system_code: str | None = None


class MaintenanceHistoryStats(BaseModel):
    total: int
    last_30_days: int
    by_system: dict[str, int]
    top_faults: list[dict[str, str | int]]
    recurrence_count: int
    recent: list[MaintenanceHistoryRecord]
