"""AgentLens API: isolated project telemetry backed by PostgreSQL."""

from __future__ import annotations

import json
import logging
import time
import uuid
import hmac
from typing import Annotated, Literal
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import check_database, get_session
from .models import Project
from .repository import (
    consume_rate_limit,
    create_project,
    ensure_account,
    get_events,
    get_owned_project,
    get_project_by_key,
    get_provider_aggregates,
    get_stats,
    insert_event,
    list_owned_projects,
)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps(
            {
                "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%SZ"),
                "level": record.levelname,
                "event": record.getMessage(),
                "request_id": getattr(record, "request_id", None),
                "project_id": getattr(record, "project_id", None),
                "method": getattr(record, "method", None),
                "path": getattr(record, "path", None),
                "status_code": getattr(record, "status_code", None),
                "duration_ms": getattr(record, "duration_ms", None),
            },
            separators=(",", ":"),
        )


logger = logging.getLogger("agentlens")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False


settings_at_startup = get_settings()
app = FastAPI(title="AgentLens API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_at_startup.cors_origins,
    allow_credentials=settings_at_startup.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id"],
)
logger.info(
    "cors_configured origins=%s source=%s environment=%s credentials=%s",
    settings_at_startup.cors_origins,
    settings_at_startup.cors_origins_source,
    settings_at_startup.environment,
    settings_at_startup.cors_allow_credentials,
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "")[:128] or str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["x-request-id"] = request_id
        return response
    finally:
        logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "project_id": getattr(request.state, "project_id", None),
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            },
        )


class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    webhook_url: str | None = Field(default=None, max_length=2048)


def error_category_for_status(status_code: int | None) -> str | None:
    categories = {
        401: "Authentication",
        403: "Permission",
        404: "Not Found",
        408: "Timeout",
        422: "Validation",
        429: "Rate Limit",
        500: "Internal Server Error",
    }
    if status_code in categories:
        return categories[status_code]
    if status_code is not None and status_code >= 500:
        return "Server Error"
    if status_code is not None and status_code >= 400:
        return "HTTP Error"
    return None


class EventIn(BaseModel):
    """A privacy-safe event envelope accepted from native or generic SDKs.

    The camelCase aliases intentionally match the public generic JavaScript
    API, while snake_case remains fully backward compatible for existing
    direct API callers and Python integrations.
    """

    model_config = ConfigDict(populate_by_name=True)

    provider: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=200)
    latency_ms: float = Field(ge=0, validation_alias=AliasChoices("latency_ms", "latencyMs"))
    success: bool
    error: str | None = Field(default=None, max_length=10000)
    est_cost_usd: float | None = Field(default=None, ge=0, validation_alias=AliasChoices("est_cost_usd", "estimatedCost"))
    status_code: int | None = Field(default=None, ge=100, le=599, validation_alias=AliasChoices("status_code", "statusCode"))
    input_tokens: int | None = Field(default=None, ge=0, validation_alias=AliasChoices("input_tokens", "inputTokens"))
    output_tokens: int | None = Field(default=None, ge=0, validation_alias=AliasChoices("output_tokens", "outputTokens"))
    error_category: str | None = Field(default=None, min_length=1, max_length=100, validation_alias=AliasChoices("error_category", "errorCategory"))
    retry_count: int = Field(default=0, ge=0, le=1000, validation_alias=AliasChoices("retry_count", "retryCount"))
    instrumentation_type: Literal["native", "generic"] = Field(
        default="generic", validation_alias=AliasChoices("instrumentation_type", "instrumentationType")
    )
    request_url: str | None = Field(default=None, max_length=2048, validation_alias=AliasChoices("request_url", "requestUrl"))
    endpoint: str | None = Field(default=None, max_length=2048)
    http_method: str | None = Field(default=None, min_length=1, max_length=16, validation_alias=AliasChoices("http_method", "httpMethod"))

    @field_validator("request_url", "endpoint")
    @classmethod
    def remove_sensitive_url_parts(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or not parsed.hostname:
            raise ValueError("request URLs must be absolute http or https URLs")
        hostname = f"[{parsed.hostname}]" if ":" in parsed.hostname else parsed.hostname
        netloc = f"{hostname}:{parsed.port}" if parsed.port is not None else hostname
        return f"{parsed.scheme}://{netloc}{parsed.path}"

    @field_validator("http_method")
    @classmethod
    def normalize_http_method(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.upper()
        if not normalized.isalpha():
            raise ValueError("http_method must contain letters only")
        return normalized

    @model_validator(mode="after")
    def infer_missing_error_category(self) -> "EventIn":
        if not self.success and self.error_category is None:
            self.error_category = error_category_for_status(self.status_code)
        return self


def require_project(
    request: Request,
    response: Response,
    x_api_key: Annotated[str, Header(min_length=3)],
    session: Annotated[Session, Depends(get_session)],
) -> Project:
    """Authenticate and apply the database-backed limit before data access."""
    settings: Settings = get_settings()
    project = get_project_by_key(session, x_api_key, settings.api_key_pepper)
    if project is None:
        raise HTTPException(status_code=401, detail="Invalid API key")

    request.state.project_id = project.id
    allowed, retry_after = consume_rate_limit(
        session,
        project.id,
        capacity=settings.rate_limit_capacity,
        refill_per_second=settings.rate_limit_refill_per_second,
    )
    session.commit()
    if not allowed:
        response.headers["Retry-After"] = str(retry_after)
        raise HTTPException(
            status_code=429,
            detail="API key rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
    return project


def require_account(
    x_agentlens_account_id: Annotated[str | None, Header()] = None,
    x_agentlens_internal_token: Annotated[str | None, Header()] = None,
) -> str:
    """Accept account identity only from the authenticated Next server.

    The browser holds an HTTP-only Better Auth session cookie. The browser
    never receives this internal token and cannot manufacture account-scoped
    FastAPI requests directly.
    """

    settings = get_settings()
    if not settings.internal_api_token:
        raise HTTPException(status_code=503, detail="Account API is not configured")
    if not x_agentlens_internal_token or not hmac.compare_digest(
        x_agentlens_internal_token, settings.internal_api_token
    ):
        raise HTTPException(status_code=401, detail="Account authentication failed")
    if not x_agentlens_account_id or len(x_agentlens_account_id) > 64:
        raise HTTPException(status_code=401, detail="Account identity is missing or invalid")
    return x_agentlens_account_id


def require_owned_project(
    project_id: str,
    account_id: Annotated[str, Depends(require_account)],
    session: Annotated[Session, Depends(get_session)],
) -> Project:
    project = get_owned_project(session, account_id, project_id)
    if project is None:
        # Do not disclose whether a project owned by someone else exists.
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/v1/account/projects")
def account_projects(
    account_id: Annotated[str, Depends(require_account)],
    session: Annotated[Session, Depends(get_session)],
):
    ensure_account(session, account_id)
    return {"projects": list_owned_projects(session, account_id)}


@app.post("/v1/account/projects", status_code=201)
def make_account_project(
    payload: ProjectIn,
    account_id: Annotated[str, Depends(require_account)],
    session: Annotated[Session, Depends(get_session)],
):
    settings = get_settings()
    ensure_account(session, account_id)
    return create_project(
        session,
        payload.name,
        settings.api_key_pepper,
        settings.rate_limit_capacity,
        owner_account_id=account_id,
        webhook_url=payload.webhook_url,
    )


@app.get("/v1/account/projects/{project_id}")
def account_project(project: Annotated[Project, Depends(require_owned_project)]):
    return {
        "project_id": project.id,
        "name": project.name,
        "webhook_configured": bool(project.webhook_url),
        "created_at": project.created_at,
    }


@app.get("/v1/account/projects/{project_id}/stats")
def account_project_stats(
    project: Annotated[Project, Depends(require_owned_project)],
    session: Annotated[Session, Depends(get_session)],
):
    return get_stats(session, project.id)


@app.get("/v1/account/projects/{project_id}/events")
def account_project_events(
    project: Annotated[Project, Depends(require_owned_project)],
    session: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return get_events(session, project.id, limit=limit, offset=offset)


@app.get("/v1/account/projects/{project_id}/providers")
def account_project_providers(
    project: Annotated[Project, Depends(require_owned_project)],
    session: Annotated[Session, Depends(get_session)],
):
    return get_provider_aggregates(session, project.id)


@app.post("/v1/events")
def ingest_event(
    payload: EventIn,
    project: Annotated[Project, Depends(require_project)],
    session: Annotated[Session, Depends(get_session)],
):
    insert_event(
        session,
        project.id,
        payload.provider,
        payload.model,
        payload.latency_ms,
        payload.success,
        payload.error,
        payload.est_cost_usd,
        payload.status_code,
        payload.input_tokens,
        payload.output_tokens,
        payload.error_category,
        payload.retry_count,
        payload.instrumentation_type,
        payload.request_url,
        payload.endpoint,
        payload.http_method,
    )
    return {"ok": True}


@app.get("/v1/stats")
def stats(
    project: Annotated[Project, Depends(require_project)],
    session: Annotated[Session, Depends(get_session)],
):
    return get_stats(session, project.id)


@app.get("/v1/events")
def events(
    project: Annotated[Project, Depends(require_project)],
    session: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Read this authenticated project's event history, newest first."""
    return get_events(session, project.id, limit=limit, offset=offset)


@app.get("/v1/providers")
def providers(
    project: Annotated[Project, Depends(require_project)],
    session: Annotated[Session, Depends(get_session)],
):
    """Detect providers/models from this project's real event metadata."""
    return get_provider_aggregates(session, project.id)


@app.get("/health")
def health():
    try:
        check_database()
    except Exception as exc:
        logger.error("health_check_failed", extra={"status_code": 503})
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "ok"}
