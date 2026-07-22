"""Universal, metadata-only AgentLens telemetry for Python server applications."""

from __future__ import annotations

import json
import threading
import urllib.request
from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class _Config:
    api_key: str
    base_url: str
    timeout_seconds: float


_config: _Config | None = None


def init(*, apikey: str | None = None, api_key: str | None = None, base_url: str = "http://localhost:8001", timeout_seconds: float = 5.0) -> None:
    """Configure server-side telemetry once during application startup.

    ``apikey`` is accepted for the documented public API; ``api_key`` is a
    readable alias. Never call this from client-side or checked-in code.
    """

    global _config
    key = (apikey or api_key or "").strip()
    if not key:
        raise ValueError("AgentLens init requires a project API key.")
    normalized_url = base_url.rstrip("/")
    if not normalized_url.startswith(("http://", "https://")):
        raise ValueError("AgentLens base_url must use http or https.")
    if timeout_seconds <= 0:
        raise ValueError("AgentLens timeout_seconds must be positive.")
    _config = _Config(api_key=key, base_url=normalized_url, timeout_seconds=timeout_seconds)


def _deliver(payload: dict[str, object], config: _Config) -> None:
    request = urllib.request.Request(
        f"{config.base_url}/v1/events",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"content-type": "application/json", "x-api-key": config.api_key},
    )
    try:
        with urllib.request.urlopen(request, timeout=config.timeout_seconds):
            pass
    except Exception:
        # Telemetry remains best-effort. It must never replace a provider
        # response or exception with an AgentLens transport failure.
        pass


def track(
    *,
    provider: str,
    model: str,
    latency_ms: float,
    success: bool,
    status_code: int | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    estimated_cost: float | None = None,
    error_category: str | None = None,
    retry_count: int = 0,
    instrumentation_type: Literal["native", "generic"] = "generic",
) -> None:
    """Queue a privacy-safe event for any provider or custom model endpoint."""

    if _config is None:
        raise RuntimeError("Call agentlens.init() before agentlens.track().")
    if not provider.strip() or not model.strip():
        raise ValueError("AgentLens telemetry requires a provider and model.")
    if latency_ms < 0:
        raise ValueError("AgentLens latency_ms must be non-negative.")
    if retry_count < 0:
        raise ValueError("AgentLens retry_count must be non-negative.")
    payload: dict[str, object] = {
        "provider": provider,
        "model": model,
        "latency_ms": latency_ms,
        "success": success,
        "status_code": status_code,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "estimatedCost": estimated_cost,
        "error_category": error_category,
        "retry_count": retry_count,
        "instrumentation_type": instrumentation_type,
    }
    threading.Thread(target=_deliver, args=(payload, _config), daemon=True).start()


__all__ = ["init", "track"]
