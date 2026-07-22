#!/bin/sh
set -eu

attempt=1
until alembic upgrade head; do
  if [ "$attempt" -ge 30 ]; then
    echo "Database migrations failed after ${attempt} attempts." >&2
    exit 1
  fi
  echo "Database is not ready for migrations; retrying (${attempt}/30)..." >&2
  attempt=$((attempt + 1))
  sleep 1
done
exec "$@"
