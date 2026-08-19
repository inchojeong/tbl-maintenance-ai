from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Marine AI Maintenance Assistant"
    openai_api_key: str | None = None
    database_path: str = str(Path(__file__).resolve().parent.parent / "data" / "app.db")
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
