#!/bin/sh
set -eu

attempt=1
max_attempts="${AGENTLENS_MIGRATION_ATTEMPTS:-5}"
migration_timeout="${AGENTLENS_MIGRATION_TIMEOUT_SECONDS:-75}"

echo "Applying database migrations before starting the AgentLens API..."
until python -c 'import os, subprocess; subprocess.run(["alembic", "upgrade", "head"], check=True, timeout=int(os.environ.get("AGENTLENS_MIGRATION_TIMEOUT_SECONDS", "75")))'; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database migrations failed after ${attempt} attempts; the API will not start with an unknown schema." >&2
    exit 1
  fi
  echo "Database migration attempt ${attempt}/${max_attempts} failed or timed out after ${migration_timeout}s; retrying in 3s..." >&2
  attempt=$((attempt + 1))
  sleep 3
done

echo "Database migrations complete. Starting web server on PORT=${PORT:-8001}..."
exec "$@"
