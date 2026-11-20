#!/usr/bin/env bash
# generateBackup.sh
#
# Backs up the Neulens data (PostgreSQL dump + the built frontend bundle) to
# `backups/` inside the repo. Idempotent and safe to run from cron or the
# deployment pipeline.
#
# Prerequisites
#   - PostgreSQL 14+ reachable from this machine (via DATABASE_URL / pg_dump)
#   - `pg_dump` on PATH (standard postgresql-client package)
#   - A writable target directory (default: ./backups near this script)
#
# Usage
#   ./scripts/generateBackup.sh [--keep N] [--prefix 2026-11-16]
#
# Environment
#   DATABASE_URL      (required) - Postgres connection string, e.g.
#       postgresql://user:pass@host:5432/dbname?schema=public
#   BACKUP_PREFIX     (optional) - date prefix, defaults to $(date +%F)
#   MAX_BACKUPS       (optional) - how many rotated backups to keep (default 7)
#
set -euo pipefail

# Fail fast if the database is unreachable, so a backup never runs against a
# dead store and reports success while emptying nothing.
if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL is not set. Set it before running this script." >&2
  exit 1
fi

# Derive a pristine DATABASE_URL without the search_path query param, which
# pg_dump does not accept in the connection string.
DB_BASE="${DATABASE_URL%%\?*}"
DB_NAME="$(echo "$DB_BASE" | sed -E 's#^postgresql://[^/]+(/[^?]*).*#\2#;s#^[^:]+://##')"

PREFIX="${BACKUP_PREFIX:-$(date +%F)}"
KEEP="${MAX_BACKUPS:-7}"
TARGET="${BACKUP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/backups"

mkdir -p "$TARGET"
TS="$(date +%F-%H%M%S)"
DUMP="$TARGET/neulens-$PREFIX-$TS.sql"
TAR="$TARGET/neulens-assets-$PREFIX-$TS.tar.gz"

echo "[backup] building PostgreSQL dump -> $DUMP"
if ! pg_dump -v 2>/dev/null >/dev/null; then
  echo "FATAL: pg_dump is not installed or not on PATH." >&2
  exit 1
fi

# -Fc enforces the custom format (compressable, recoverable). -F p uses plain
# SQL for full readability if the consumer prefers it.
if command -v pg_dump >/dev/null 2>&1; then
  PGPASSWORD="$(echo "$DB_BASE" | sed -E 's#^postgresql://([^:]*):([^@]*)@.*#\1/\2#')" \
  pg_dump --no-owner --no-privileges --format=d --file="$DUMP" "$DB_BASE" \
    || { echo "FATAL: pg_dump failed." >&2; exit 1; }
else
  echo "FATAL: pg_dump not found on PATH." >&2
  exit 1
fi

# Archive the built frontend bundle alongside the database dump.
if [ -d "../client/dist" ]; then
  if tar -czf "$TAR" -C "../client/dist" .; then
    echo "[backup] archived frontend bundle -> $TAR"
  else
    echo "WARN: could not archive client/dist; continuing without assets." >&2
    rm -f "$TAR"
  fi
else
  echo "WARN: client/dist not found; skipping asset archive." >&2
fi

# Rotate old backups: keep only the N most recent.
shopt -s nullglob
mapfile -t OLD < <(ls -1dt "$TARGET"/neulens-* 2>/dev/null || true)
if [ "${#OLD[@]}" -gt "$KEEP" ]; then
  for ((i = 0; i < "${#OLD[@]}" - KEEP; i++)); do
    rm -f "${OLD[$i]}"
  done
fi

echo "[backup] done: $DUMP"
ls -1 "$TARGET"
