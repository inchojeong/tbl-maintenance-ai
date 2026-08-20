"""
Maintenance history repository + similarity search.

PROTOTYPE DEMO ONLY — fictional records, not real military / DELIIS data.
Similarity is keyword + category weighted scoring (swapable later).
"""

from __future__ import annotations

import json
import re
import sqlite3
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from app.db import get_conn
from app.schemas.maintenance import (
    AircraftInfo,
    MaintenanceHistoryCreate,
    MaintenanceHistoryRecord,
    MaintenanceHistoryStats,
    SimilarMaintenanceItem,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SEED_PATH = DATA_DIR / "maintenance_history.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical_aircraft_id(aircraft_id: str) -> str:
    """Map legacy DEMO-KUH-01 → AC-001 for history queries."""
    if aircraft_id == "DEMO-KUH-01":
        return "AC-001"
    return aircraft_id


def ensure_maintenance_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS maintenance_history (
            maintenance_id TEXT PRIMARY KEY,
            aircraft_id TEXT NOT NULL,
            maintenance_date TEXT NOT NULL,
            flight_hours REAL,
            fault_code TEXT,
            system_category TEXT,
            component TEXT,
            symptom TEXT NOT NULL,
            detected_value TEXT,
            normal_range TEXT,
            severity TEXT,
            diagnosis TEXT,
            root_cause TEXT,
            maintenance_action TEXT,
            replaced_part TEXT,
            technician_note TEXT,
            maintenance_result TEXT,
            recurrence INTEGER DEFAULT 0,
            reference_manual TEXT,
            symptom_code TEXT,
            system_code TEXT,
            created_at TEXT NOT NULL,
            is_dummy INTEGER DEFAULT 1
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_mh_aircraft ON maintenance_history(aircraft_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_mh_symptom ON maintenance_history(symptom_code)"
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS aircraft (
            aircraft_id TEXT PRIMARY KEY,
            aircraft_type TEXT,
            aircraft_number TEXT,
            total_flight_hours REAL,
            display_name TEXT,
            alias_of TEXT
        )
        """
    )


def seed_maintenance_history_if_empty(conn: sqlite3.Connection) -> None:
    """Seed or refresh dummy history from JSON when empty / version mismatch."""
    ensure_maintenance_schema(conn)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS maintenance_seed_meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        """
    )
    if not SEED_PATH.exists():
        return
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    seed_version = str(payload.get("version", "1.0"))
    seed_count = len(payload.get("records", []))
    row = conn.execute(
        "SELECT value FROM maintenance_seed_meta WHERE key = 'version'"
    ).fetchone()
    current_version = row["value"] if row else None
    n = conn.execute("SELECT COUNT(*) AS c FROM maintenance_history").fetchone()["c"]
    # Reseed when empty, version changed, or dummy count behind seed file
    dummy_n = conn.execute(
        "SELECT COUNT(*) AS c FROM maintenance_history WHERE is_dummy = 1"
    ).fetchone()["c"]
    need_reseed = (
        n == 0
        or current_version != seed_version
        or dummy_n < seed_count
    )
    if not need_reseed:
        return

    # Keep user-created (non-dummy) rows; replace all dummy seed rows
    conn.execute("DELETE FROM maintenance_history WHERE is_dummy = 1")
    for a in payload.get("aircraft", []):
        conn.execute(
            """
            INSERT OR REPLACE INTO aircraft
            (aircraft_id, aircraft_type, aircraft_number, total_flight_hours, display_name, alias_of)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                a["aircraft_id"],
                a.get("aircraft_type"),
                a.get("aircraft_number"),
                a.get("total_flight_hours"),
                a.get("display_name"),
                a.get("alias_of"),
            ),
        )
    for r in payload.get("records", []):
        conn.execute(
            """
            INSERT OR REPLACE INTO maintenance_history (
              maintenance_id, aircraft_id, maintenance_date, flight_hours, fault_code,
              system_category, component, symptom, detected_value, normal_range, severity,
              diagnosis, root_cause, maintenance_action, replaced_part, technician_note,
              maintenance_result, recurrence, reference_manual, symptom_code, system_code,
              created_at, is_dummy
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                r["maintenance_id"],
                r["aircraft_id"],
                r["maintenance_date"],
                r.get("flight_hours"),
                r.get("fault_code"),
                r.get("system_category"),
                r.get("component"),
                r["symptom"],
                r.get("detected_value"),
                r.get("normal_range"),
                r.get("severity"),
                r.get("diagnosis"),
                r.get("root_cause"),
                r.get("maintenance_action"),
                r.get("replaced_part"),
                r.get("technician_note"),
                r.get("maintenance_result"),
                1 if r.get("recurrence") else 0,
                r.get("reference_manual"),
                r.get("symptom_code"),
                r.get("system_code"),
                r.get("created_at") or _now_iso(),
                1 if r.get("is_dummy", True) else 0,
            ),
        )
    conn.execute(
        """
        INSERT OR REPLACE INTO maintenance_seed_meta (key, value) VALUES ('version', ?)
        """,
        (seed_version,),
    )
    conn.commit()


def _row_to_record(row: sqlite3.Row) -> MaintenanceHistoryRecord:
    d = dict(row)
    d["recurrence"] = bool(d.get("recurrence"))
    d["is_dummy"] = bool(d.get("is_dummy", 1))
    for key in (
        "fault_code",
        "system_category",
        "component",
        "diagnosis",
        "root_cause",
        "maintenance_action",
        "maintenance_result",
    ):
        if d.get(key) is None:
            d[key] = ""
    if d.get("flight_hours") is None:
        d["flight_hours"] = 0.0
    return MaintenanceHistoryRecord.model_validate(d)


def list_aircraft() -> list[AircraftInfo]:
    conn = get_conn()
    seed_maintenance_history_if_empty(conn)
    rows = conn.execute(
        "SELECT * FROM aircraft WHERE alias_of IS NULL ORDER BY aircraft_id"
    ).fetchall()
    conn.close()
    return [AircraftInfo.model_validate(dict(r)) for r in rows]


def get_aircraft(aircraft_id: str) -> AircraftInfo | None:
    aid = _canonical_aircraft_id(aircraft_id)
    conn = get_conn()
    seed_maintenance_history_if_empty(conn)
    row = conn.execute(
        "SELECT * FROM aircraft WHERE aircraft_id = ?", (aid,)
    ).fetchone()
    conn.close()
    return AircraftInfo.model_validate(dict(row)) if row else None


def list_history(
    aircraft_id: str | None = None,
    system_category: str | None = None,
    component: str | None = None,
    fault_code: str | None = None,
    symptom: str | None = None,
    maintenance_result: str | None = None,
    severity: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 100,
) -> list[MaintenanceHistoryRecord]:
    conn = get_conn()
    seed_maintenance_history_if_empty(conn)
    sql = "SELECT * FROM maintenance_history WHERE 1=1"
    params: list[object] = []
    if aircraft_id:
        aid = _canonical_aircraft_id(aircraft_id)
        sql += " AND aircraft_id = ?"
        params.append(aid)
    if system_category:
        sql += " AND system_category LIKE ?"
        params.append(f"%{system_category}%")
    if component:
        sql += " AND component LIKE ?"
        params.append(f"%{component}%")
    if fault_code:
        sql += " AND fault_code LIKE ?"
        params.append(f"%{fault_code}%")
    if symptom:
        sql += " AND (symptom LIKE ? OR diagnosis LIKE ? OR root_cause LIKE ?)"
        params.extend([f"%{symptom}%"] * 3)
    if maintenance_result:
        sql += " AND maintenance_result LIKE ?"
        params.append(f"%{maintenance_result}%")
    if severity:
        sql += " AND severity = ?"
        params.append(severity)
    if date_from:
        sql += " AND maintenance_date >= ?"
        params.append(date_from)
    if date_to:
        sql += " AND maintenance_date <= ?"
        params.append(date_to)
    sql += " ORDER BY maintenance_date DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [_row_to_record(r) for r in rows]


def get_history(maintenance_id: str) -> MaintenanceHistoryRecord | None:
    conn = get_conn()
    seed_maintenance_history_if_empty(conn)
    row = conn.execute(
        "SELECT * FROM maintenance_history WHERE maintenance_id = ?",
        (maintenance_id,),
    ).fetchone()
    conn.close()
    return _row_to_record(row) if row else None


def _tokens(text: str) -> set[str]:
    parts = re.split(r"[\s,./·\-_/]+", (text or "").lower())
    return {p for p in parts if len(p) >= 2}


def score_similarity(
    query: dict[str, str | None],
    record: MaintenanceHistoryRecord,
) -> float:
    """Weighted similarity 0..1. Separated for future embedding swap."""
    score = 0.0
    w_sum = 0.0

    def add(weight: float, hit: bool, partial: float = 0.0) -> None:
        nonlocal score, w_sum
        w_sum += weight
        score += weight * (1.0 if hit else partial)

    q_scode = (query.get("symptom_code") or "").upper()
    q_sys = (query.get("system_code") or "").upper()
    q_fault = (query.get("fault_code") or "").upper()
    q_symptom = query.get("symptom") or ""
    q_diag = query.get("diagnosis") or ""
    q_comp = query.get("component") or ""
    q_val = query.get("detected_value") or ""

    add(0.28, bool(q_scode) and q_scode == (record.symptom_code or "").upper())
    add(0.18, bool(q_sys) and q_sys == (record.system_code or "").upper())
    add(
        0.12,
        bool(q_fault)
        and q_fault
        and q_fault in (record.fault_code or "").upper(),
    )

    qt = _tokens(f"{q_symptom} {q_diag} {q_comp}")
    rt = _tokens(
        f"{record.symptom} {record.diagnosis} {record.root_cause} "
        f"{record.component} {record.maintenance_action}"
    )
    if qt and rt:
        jacc = len(qt & rt) / max(len(qt | rt), 1)
        add(0.32, False, jacc)
    else:
        add(0.32, False, 0.0)

    # crude numeric proximity for PSI values
    nums_q = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*psi", q_val.lower())]
    nums_r = [
        float(x)
        for x in re.findall(
            r"(\d+(?:\.\d+)?)\s*psi", (record.detected_value or "").lower()
        )
    ]
    if nums_q and nums_r:
        diff = abs(nums_q[0] - nums_r[0])
        prox = max(0.0, 1.0 - diff / 40.0)
        add(0.10, False, prox)
    else:
        add(0.10, False, 0.0)

    return score / w_sum if w_sum else 0.0


def search_similar(
    *,
    aircraft_id: str | None = None,
    symptom_code: str | None = None,
    system_code: str | None = None,
    fault_code: str | None = None,
    symptom: str | None = None,
    diagnosis: str | None = None,
    component: str | None = None,
    detected_value: str | None = None,
    top_k: int = 5,
) -> list[SimilarMaintenanceItem]:
    records = list_history(aircraft_id=aircraft_id, limit=500)
    # Also include fleet-wide if few aircraft-local hits
    if aircraft_id and len(records) < 3:
        records = list_history(limit=500)
    elif aircraft_id and symptom_code:
        same = [
            r
            for r in records
            if (r.symptom_code or "").upper() == symptom_code.upper()
        ]
        if len(same) < 5:
            records = list_history(limit=500)

    q = {
        "symptom_code": symptom_code,
        "system_code": system_code,
        "fault_code": fault_code,
        "symptom": symptom,
        "diagnosis": diagnosis,
        "component": component,
        "detected_value": detected_value,
    }
    scored: list[SimilarMaintenanceItem] = []
    for r in records:
        s = score_similarity(q, r)
        if s < 0.15:
            continue
        # Prefer same aircraft slightly
        if aircraft_id and r.aircraft_id == _canonical_aircraft_id(aircraft_id):
            s = min(1.0, s + 0.05)
        scored.append(
            SimilarMaintenanceItem(
                record=r,
                similarity=round(s, 4),
                similarity_percent=int(round(s * 100)),
            )
        )
    scored.sort(key=lambda x: x.similarity, reverse=True)
    return scored[:top_k]


def create_history(body: MaintenanceHistoryCreate) -> MaintenanceHistoryRecord:
    conn = get_conn()
    seed_maintenance_history_if_empty(conn)
    mid = f"MNT-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"
    mdate = body.maintenance_date or date.today().isoformat()
    created = _now_iso()
    aid = _canonical_aircraft_id(body.aircraft_id)
    ac = conn.execute(
        "SELECT total_flight_hours FROM aircraft WHERE aircraft_id = ?", (aid,)
    ).fetchone()
    fh = body.flight_hours
    if fh is None and ac:
        fh = float(ac["total_flight_hours"] or 0)
    conn.execute(
        """
        INSERT INTO maintenance_history (
          maintenance_id, aircraft_id, maintenance_date, flight_hours, fault_code,
          system_category, component, symptom, detected_value, normal_range, severity,
          diagnosis, root_cause, maintenance_action, replaced_part, technician_note,
          maintenance_result, recurrence, reference_manual, symptom_code, system_code,
          created_at, is_dummy
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            mid,
            aid,
            mdate,
            fh,
            body.fault_code,
            body.system_category,
            body.component,
            body.symptom,
            body.detected_value,
            body.normal_range,
            body.severity,
            body.diagnosis,
            body.root_cause,
            body.maintenance_action,
            body.replaced_part,
            body.technician_note,
            body.maintenance_result,
            1 if body.recurrence else 0,
            body.reference_manual,
            body.symptom_code,
            body.system_code,
            created,
            0,
        ),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM maintenance_history WHERE maintenance_id = ?", (mid,)
    ).fetchone()
    conn.close()
    return _row_to_record(row)


def history_stats(aircraft_id: str | None = None) -> MaintenanceHistoryStats:
    records = list_history(aircraft_id=aircraft_id, limit=500)
    cutoff = (date.today() - timedelta(days=30)).isoformat()
    by_system: dict[str, int] = {}
    fault_counts: dict[str, int] = {}
    for r in records:
        by_system[r.system_category] = by_system.get(r.system_category, 0) + 1
        key = r.symptom or r.fault_code
        fault_counts[key] = fault_counts.get(key, 0) + 1
    top = sorted(fault_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return MaintenanceHistoryStats(
        total=len(records),
        last_30_days=sum(1 for r in records if r.maintenance_date >= cutoff),
        by_system=by_system,
        top_faults=[{"symptom": k, "count": v} for k, v in top],
        recurrence_count=sum(1 for r in records if r.recurrence),
        recent=records[:5],
    )
