from __future__ import annotations

import sqlite3
from pathlib import Path

from app.config import get_settings


def get_conn() -> sqlite3.Connection:
    path = Path(get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS maintenance_result (
            id TEXT PRIMARY KEY,
            aircraft_id TEXT NOT NULL,
            actions TEXT NOT NULL,
            parts_used TEXT,
            outcome TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()
