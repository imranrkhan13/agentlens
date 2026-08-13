"""Database queries.  Tenant filtering is explicit at every read boundary."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Account, ApiRateLimit, Event, Project


def hash_api_key(api_key: str, pepper: str) -> str:
    """Return a deterministic keyed digest suitable for an indexed lookup.

    Keys have 256 bits of randomness.  HMAC-SHA-256 is deliberately fast so a
    normal request can use an indexed equality lookup; the server-side pepper
    prevents an attacker with a database dump from validating guessed keys.
    """
    return hmac.new(pepper.encode("utf-8"), api_key.encode("utf-8"), hashlib.sha256).hexdigest()


def ensure_account(session: Session, account_id: str) -> None:
    """Create the product account lazily after Next has verified a session.

    The account id originates from a server-side Better Auth session and is
    delivered only over the trusted internal API channel. No browser-provided
    account identity is accepted by FastAPI.
    """

    # Multiple server components can load account context concurrently on the
    # first page view. A SELECT followed by INSERT races under that workload;
    # PostgreSQL's conflict handling makes lazy account creation atomic.
    session.execute(
        pg_insert(Account)
        .values(id=account_id)
        .on_conflict_do_nothing(index_elements=[Account.id])
    )
    session.commit()


def create_project(
    session: Session,
    name: str,
    pepper: str,
    capacity: float,
    *,
    owner_account_id: str | None = None,
    webhook_url: str | None = None,
    technology: str = "other",
) -> dict[str, str]:
    # UUID collision is extraordinarily unlikely.  The small retry guards the
    # unique constraint rather than ever handing two tenants the same identity.
    for _ in range(3):
        project_id = str(uuid.uuid4())
        api_key = "al_" + secrets.token_urlsafe(32)
        project = Project(
            id=project_id,
            name=name,
            api_key_hash=hash_api_key(api_key, pepper),
            owner_account_id=owner_account_id,
            webhook_url=webhook_url,
            technology=technology,
        )
        session.add(project)
        try:
            # The models intentionally do not expose an ORM relationship.
            # Flush the parent before its bucket so the foreign key is valid.
            session.flush()
            session.add(ApiRateLimit(project_id=project_id, tokens=capacity, updated_at=datetime.now(timezone.utc)))
            session.commit()
            return {"project_id": project_id, "api_key": api_key, "name": name, "technology": technology}
        except IntegrityError:
            session.rollback()
    raise RuntimeError("Could not allocate a unique project identity.")


def get_owned_project(session: Session, account_id: str, project_id: str) -> Project | None:
    return session.scalar(
        select(Project).where(Project.id == project_id, Project.owner_account_id == account_id)
    )


def list_owned_projects(session: Session, account_id: str) -> list[dict[str, object]]:
    projects = session.scalars(
        select(Project)
        .where(Project.owner_account_id == account_id)
        .order_by(Project.created_at.asc(), Project.name.asc())
    ).all()
    return [
        {
            "project_id": project.id,
            "name": project.name,
            "webhook_configured": bool(project.webhook_url),
            "technology": project.technology,
            "created_at": project.created_at,
        }
        for project in projects
    ]


def get_project_by_key(session: Session, api_key: str, pepper: str) -> Project | None:
    key_hash = hash_api_key(api_key, pepper)
    return session.scalar(select(Project).where(Project.api_key_hash == key_hash))


def consume_rate_limit(
    session: Session,
    project_id: str,
    *,
    capacity: float,
    refill_per_second: float,
) -> tuple[bool, int]:
    """Atomically consume a token and return (allowed, retry_after_seconds)."""
    state = session.scalar(
        select(ApiRateLimit).where(ApiRateLimit.project_id == project_id).with_for_update()
    )
    # Each project gets its bucket at creation. This branch also recovers
    # safely if a legacy/manual migration omitted the bucket row.
    now = datetime.now(timezone.utc)
    if state is None:
        state = ApiRateLimit(project_id=project_id, tokens=capacity, updated_at=now)
        session.add(state)
        session.flush()

    elapsed = max(0.0, (now - state.updated_at).total_seconds())
    available = min(capacity, state.tokens + elapsed * refill_per_second)
    state.updated_at = now
    if available < 1:
        state.tokens = available
        retry_after = max(1, int((1 - available) / refill_per_second) + 1)
        return False, retry_after

    state.tokens = available - 1
    return True, 0


def insert_event(
    session: Session,
    project_id: str,
    provider: str,
    model: str,
    latency_ms: float,
    success: bool,
    error: str | None = None,
    est_cost_usd: float | None = None,
    status_code: int | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    error_category: str | None = None,
    retry_count: int = 0,
    instrumentation_type: str = "generic",
    request_url: str | None = None,
    endpoint: str | None = None,
    http_method: str | None = None,
) -> None:
    session.add(
        Event(
            project_id=project_id,
            provider=provider,
            model=model,
            latency_ms=latency_ms,
            success=success,
            error=error,
            est_cost_usd=est_cost_usd,
            status_code=status_code,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            error_category=error_category,
            retry_count=retry_count,
            instrumentation_type=instrumentation_type,
            request_url=request_url,
            endpoint=endpoint,
            http_method=http_method,
        )
    )
    session.commit()


def get_stats(session: Session, project_id: str) -> dict[str, object]:
    """Return plain-language dashboard aggregates for exactly one project.

    The field names remain API-friendly, but every value is computed from
    events that actually belong to ``project_id``.  The dashboard can use this
    single response for a founder-friendly summary without manufacturing
    telemetry client-side.
    """
    row = session.execute(
        select(
            func.count(Event.id),
            func.coalesce(func.sum(case((Event.success.is_(True), 1), else_=0)), 0),
            func.coalesce(func.sum(Event.est_cost_usd), 0),
            func.avg(Event.latency_ms),
            func.coalesce(func.sum(Event.retry_count), 0),
            func.count(func.distinct(Event.provider)),
            func.max(Event.created_at),
        ).where(Event.project_id == project_id)
    ).one()
    total, successes, cost = int(row[0]), int(row[1]), float(row[2])
    if total == 0:
        return {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "success_rate": None,
            "total_cost_usd": 0,
            "avg_latency_ms": None,
            "total_retries": 0,
            "detected_provider_count": 0,
            "latest_event_at": None,
        }
    return {
        "total_calls": total,
        "successful_calls": successes,
        "failed_calls": total - successes,
        "success_rate": round(successes / total * 100, 1),
        "total_cost_usd": round(cost, 4),
        "avg_latency_ms": round(float(row[3]), 1),
        "total_retries": int(row[4]),
        "detected_provider_count": int(row[5]),
        "latest_event_at": row[6],
    }


def get_events(session: Session, project_id: str, *, limit: int, offset: int) -> dict[str, object]:
    """Return only the authenticated project's recorded telemetry events."""
    total = int(session.scalar(select(func.count(Event.id)).where(Event.project_id == project_id)) or 0)
    events = session.scalars(
        select(Event)
        .where(Event.project_id == project_id)
        .order_by(Event.created_at.desc(), Event.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return {
        "events": [
            {
                "id": event.id,
                "provider": event.provider,
                "model": event.model,
                "latency_ms": event.latency_ms,
                "success": event.success,
                "error": event.error,
                "est_cost_usd": event.est_cost_usd,
                "status_code": event.status_code,
                "input_tokens": event.input_tokens,
                "output_tokens": event.output_tokens,
                "error_category": event.error_category,
                "retry_count": event.retry_count,
                "instrumentation_type": event.instrumentation_type,
                "request_url": event.request_url,
                "endpoint": event.endpoint,
                "http_method": event.http_method,
                "created_at": event.created_at,
            }
            for event in events
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def _instrumentation_label(native_events: int, generic_events: int) -> str:
    if native_events and generic_events:
        return "mixed"
    return "native" if native_events else "generic"


def _top_error_categories(session: Session, project_id: str, provider: str, model: str | None = None) -> list[str]:
    filters = [Event.project_id == project_id, Event.provider == provider, Event.error_category.is_not(None)]
    if model is not None:
        filters.append(Event.model == model)
    rows = session.execute(
        select(Event.error_category, func.count(Event.id).label("count"))
        .where(*filters)
        .group_by(Event.error_category)
        .order_by(func.count(Event.id).desc(), Event.error_category.asc())
        .limit(3)
    ).all()
    return [str(row[0]) for row in rows]


def get_provider_aggregates(session: Session, project_id: str) -> dict[str, object]:
    """Derive provider and model discovery from real, project-scoped events.

    Providers are intentionally not configured ahead of time. The first event
    carrying a provider/model pair is its registration; all displayed metrics
    below are aggregates of those same stored events.
    """
    aggregate_columns = (
        func.count(Event.id).label("request_volume"),
        func.coalesce(func.sum(case((Event.success.is_(True), 1), else_=0)), 0).label("successes"),
        func.avg(Event.latency_ms).label("avg_latency_ms"),
        func.coalesce(func.sum(Event.est_cost_usd), 0).label("estimated_cost_usd"),
        func.coalesce(func.sum(Event.retry_count), 0).label("retries"),
        func.min(Event.created_at).label("first_event_at"),
        func.max(Event.created_at).label("latest_event_at"),
        func.coalesce(func.sum(case((Event.instrumentation_type == "native", 1), else_=0)), 0).label("native_events"),
        func.coalesce(func.sum(case((Event.instrumentation_type == "generic", 1), else_=0)), 0).label("generic_events"),
    )
    provider_rows = session.execute(
        select(Event.provider, *aggregate_columns)
        .where(Event.project_id == project_id)
        .group_by(Event.provider)
        .order_by(func.max(Event.created_at).desc(), Event.provider.asc())
    ).all()

    providers: list[dict[str, object]] = []
    for row in provider_rows:
        provider = str(row.provider)
        request_volume = int(row.request_volume)
        native_events = int(row.native_events)
        generic_events = int(row.generic_events)
        model_rows = session.execute(
            select(Event.model, *aggregate_columns)
            .where(Event.project_id == project_id, Event.provider == provider)
            .group_by(Event.model)
            .order_by(func.max(Event.created_at).desc(), Event.model.asc())
        ).all()
        models = [
            {
                "model": str(model_row.model),
                "request_volume": int(model_row.request_volume),
                "success_rate": round(int(model_row.successes) / int(model_row.request_volume) * 100, 1),
                "avg_latency_ms": round(float(model_row.avg_latency_ms), 1),
                "estimated_cost_usd": round(float(model_row.estimated_cost_usd), 6),
                "retries": int(model_row.retries),
                "top_error_categories": _top_error_categories(session, project_id, provider, str(model_row.model)),
                "first_event_at": model_row.first_event_at,
                "latest_event_at": model_row.latest_event_at,
                "instrumentation_type": _instrumentation_label(int(model_row.native_events), int(model_row.generic_events)),
            }
            for model_row in model_rows
        ]
        providers.append(
            {
                "provider": provider,
                "request_volume": request_volume,
                "success_rate": round(int(row.successes) / request_volume * 100, 1),
                "avg_latency_ms": round(float(row.avg_latency_ms), 1),
                "estimated_cost_usd": round(float(row.estimated_cost_usd), 6),
                "retries": int(row.retries),
                "top_error_categories": _top_error_categories(session, project_id, provider),
                "first_event_at": row.first_event_at,
                "latest_event_at": row.latest_event_at,
                "instrumentation_type": _instrumentation_label(native_events, generic_events),
                "models": models,
            }
        )
    return {"providers": providers}
