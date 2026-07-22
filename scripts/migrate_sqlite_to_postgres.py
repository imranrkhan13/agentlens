#!/usr/bin/env python3
"""One-time, fail-closed importer for the legacy AgentLens SQLite schema."""

from __future__ import annotations

import argparse
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import get_settings
from app.db import get_engine
from app.models import ApiRateLimit, Event, Project
from app.repository import hash_api_key


def parse_timestamp(value: str) -> datetime:
    timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Import legacy AgentLens SQLite data into configured PostgreSQL.")
    parser.add_argument("sqlite_path", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not args.sqlite_path.is_file():
        parser.error(f"SQLite database does not exist: {args.sqlite_path}")

    source = sqlite3.connect(args.sqlite_path)
    source.row_factory = sqlite3.Row
    try:
        projects = source.execute("SELECT id, name, api_key, created_at FROM projects").fetchall()
        events = source.execute(
            "SELECT id, project_id, provider, model, latency_ms, success, error, est_cost_usd, created_at FROM events"
        ).fetchall()
    except sqlite3.Error as exc:
        print(f"Legacy schema validation failed: {exc}", file=sys.stderr)
        return 2
    finally:
        source.close()

    project_ids = {row["id"] for row in projects}
    if len(project_ids) != len(projects) or any(row["project_id"] not in project_ids for row in events):
        print("Legacy data has duplicate project IDs or events with unknown project IDs; no data was imported.", file=sys.stderr)
        return 2
    print(f"Validated legacy source: {len(projects)} projects, {len(events)} events.")
    if args.dry_run:
        print("Dry run complete; PostgreSQL was not changed.")
        return 0

    settings = get_settings()
    engine = get_engine()
    with engine.begin() as destination:
        existing = destination.scalar(select(func.count(Project.id)))
        if existing:
            raise RuntimeError("Destination projects table is not empty; refusing to merge an ambiguous import.")
        for row in projects:
            destination.execute(
                Project.__table__.insert().values(
                    id=row["id"],
                    name=row["name"],
                    api_key_hash=hash_api_key(row["api_key"], settings.api_key_pepper),
                    created_at=parse_timestamp(row["created_at"]),
                )
            )
            destination.execute(
                ApiRateLimit.__table__.insert().values(
                    project_id=row["id"], tokens=settings.rate_limit_capacity, updated_at=datetime.now(timezone.utc)
                )
            )
        for row in events:
            destination.execute(
                Event.__table__.insert().values(
                    id=row["id"],
                    project_id=row["project_id"],
                    provider=row["provider"],
                    model=row["model"],
                    latency_ms=row["latency_ms"],
                    success=bool(row["success"]),
                    error=row["error"],
                    est_cost_usd=row["est_cost_usd"],
                    created_at=parse_timestamp(row["created_at"]),
                )
            )
    print(f"Imported {len(projects)} projects and {len(events)} events; destination stores hashes, not plaintext keys.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
