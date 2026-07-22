"""Environment-only application configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlsplit


DEVELOPMENT_CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]


def parse_cors_origins(value: str | None) -> list[str]:
    """Parse and normalize comma-separated browser origins.

    A browser Origin never includes a path or a trailing slash. Normalizing the
    configured value to ``scheme://host[:port]`` prevents subtle mismatches such
    as ``http://localhost:3000/``.
    """

    origins: list[str] = []
    for raw_origin in (value or "").split(","):
        raw_origin = raw_origin.strip()
        if not raw_origin:
            continue

        parsed = urlsplit(raw_origin)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise RuntimeError(
                f"Invalid CORS origin {raw_origin!r}. "
                "Use a full origin such as http://localhost:3000."
            )
        if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
            raise RuntimeError(
                f"CORS origin {raw_origin!r} must not include a path, query, or fragment."
            )

        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin not in origins:
            origins.append(origin)
    return origins


def parse_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise RuntimeError("Boolean environment values must be true/false, yes/no, on/off, or 1/0.")


@dataclass(frozen=True)
class Settings:
    api_key_pepper: str
    internal_api_token: str
    rate_limit_capacity: float
    rate_limit_refill_per_second: float
    cors_origins: list[str]
    cors_allow_credentials: bool
    environment: str
    cors_origins_source: str


def get_environment() -> str:
    """Return the deployment environment without silently treating production as development."""

    return os.getenv("AGENTLENS_ENV", os.getenv("NODE_ENV", "production")).strip().lower()


def get_settings() -> Settings:
    pepper = os.getenv("AGENTLENS_API_KEY_PEPPER")
    if not pepper:
        raise RuntimeError("AGENTLENS_API_KEY_PEPPER must be set to a long random secret.")

    capacity = float(os.getenv("AGENTLENS_RATE_LIMIT_CAPACITY", "120"))
    refill = float(os.getenv("AGENTLENS_RATE_LIMIT_REFILL_PER_SECOND", "2"))
    if capacity <= 0 or refill <= 0:
        raise RuntimeError("Rate-limit capacity and refill rate must both be positive.")

    environment = get_environment()
    origins = parse_cors_origins(os.getenv("AGENTLENS_CORS_ORIGINS"))
    origins_source = "AGENTLENS_CORS_ORIGINS"
    if not origins:
        if environment in {"development", "dev"}:
            origins = DEVELOPMENT_CORS_ORIGINS.copy()
            origins_source = "development defaults"
        else:
            raise RuntimeError(
                "AGENTLENS_CORS_ORIGINS must contain at least one browser origin in production, "
                "for example https://app.example.com."
            )

    return Settings(
        api_key_pepper=pepper,
        internal_api_token=os.getenv("AGENTLENS_INTERNAL_API_TOKEN", ""),
        rate_limit_capacity=capacity,
        rate_limit_refill_per_second=refill,
        cors_origins=origins,
        cors_allow_credentials=parse_bool(os.getenv("AGENTLENS_CORS_ALLOW_CREDENTIALS"), default=False),
        environment=environment,
        cors_origins_source=origins_source,
    )
