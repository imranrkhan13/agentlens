#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$project_root/.env"

if [[ ! -f "$env_file" ]]; then
  cp "$project_root/.env.example" "$env_file"
  echo "Created .env from .env.example."
fi

ensure_env() {
  local key="$1"
  local value="$2"

  if ! grep -q "^${key}=" "$env_file"; then
    printf '\n%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}

new_secret() {
  openssl rand -hex 32
}

# These values are missing only when upgrading from an API-only AgentLens
# installation. Existing values are never overwritten.
ensure_env "AGENTLENS_INTERNAL_API_TOKEN" "$(new_secret)"
ensure_env "BETTER_AUTH_SECRET" "$(new_secret)"
ensure_env "BETTER_AUTH_URL" "http://localhost:8000"

cd "$project_root"
docker compose up --build -d

echo
echo "AgentLens is starting at http://localhost:8000"
echo "The landing page, sign-up, login, and dashboard share one Next.js application and one public origin."
