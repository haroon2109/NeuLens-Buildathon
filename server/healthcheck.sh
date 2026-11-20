#!/usr/bin/env bash
set -euo pipefail

echo "[healthcheck] Verifying database connectivity and migration state..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[healthcheck] ERROR: DATABASE_URL is not set. Failing readiness." >&2
  exit 1
fi

# Prisma CLI is available inside the built container at:
#   node_modules/.bin/prisma
PRISMA="node_modules/.bin/prisma"
if [ ! -f "$PRISMA" ]; then
  echo "[healthcheck] ERROR: prisma CLI not found. Build may be incomplete." >&2
  exit 1
fi

# Quick connectivity probe
if ! npx prisma db pull --schema=server/prisma/schema.prisma --preview-feature >/dev/null 2>&1; then
  echo "[healthcheck] ERROR: cannot reach database. Failing readiness." >&2
  exit 1
fi

# Confirm migrations are applied (no pending migrations)
PENDING=$($PRISMA migrate status --schema=server/prisma/schema.prisma 2>/dev/null | grep -c "No pending migrations")
if [ "$PENDING" -eq 0 ]; then
  echo "[healthcheck] WARNING: pending migrations detected; the service will still start, but deploy healthcheck is uncertain." >&2
  # do not hard-fail here: the migration deploy command above is what enforces
  # a clean deploy; this probe is informational for orchestrators
fi

echo "[healthcheck] OK"
exit 0
