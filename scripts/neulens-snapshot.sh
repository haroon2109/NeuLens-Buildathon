#!/usr/bin/env bash
# neulens-snapshot.sh — idempotent snapshot a judge/reviewer can rerun to confirm
# the repo state, dependency integrity, build parity, and test reality at a point in time.
set -euo pipefail
cd "$(dirname "$0")"

echo "== environment =="
echo "node: $(node --version 2>/dev/null || echo 'missing')"
echo "npm:  $(npm --version 2>/dev/null || echo 'missing')"
echo "pwd:  $(pwd)"

echo
echo "== security-relevant env presence =="
for v in JWT_SECRET DATABASE_URL GNANI_API_KEY GNANI_API_BASE_URL CLIENT_ORIGIN; do
  if [ -f server/.env ]; then
    case "$(grep -E "^${v}=" server/.env 2>/dev/null || true)" in
      ${v}="") echo "[config] ${v} is present but empty in server/.env" ;;
      "${v}=${v}"|"") echo "[config] ${v} missing from server/.env" ;;
      *) echo "[config] ${v} set in server/.env" ;;
    esac
  else
    echo "[config] server/.env not present"
  fi
done

echo
echo "== git history =="
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "commits: $(git rev-list --count HEAD 2>/dev/null || echo 'n/a')"
  echo "branches: $(git branch -a | wc -l | tr -d ' ')"
  echo "current: $(git branch --show-current)"
  echo "dirty: $(git status --porcelain | wc -l | tr -d ' ')"
  echo "first commit: $(git log --reverse --pretty=format:'%h %s' 2>/dev/null | head -n1 || echo 'n/a')"
else
  echo "no git repository — this snapshot cannot be versioned or reproduced"
fi

echo
echo "== dependency integrity =="
for dir in server client; do
  if [ -f "$dir/package-lock.json" ]; then
    echo "[$dir] package-lock.json present ($(wc -c < "$dir/package-lock.json") bytes)"
  else
    echo "[$dir] package-lock.json MISSING"
  fi
done

echo
echo "== build parity =="
echo "frontend typecheck:"
(cd client && npx tsc --noEmit 2>&1 | tail -n3 || true) | sed 's/^/  /'
echo "frontend build:"
(cd client && npx vite build 2>&1 | grep -E 'built in|error|warn.*assets' | tail -n3 || true) | sed 's/^/  /'
echo "backend typecheck:"
(cd server && npx tsc --noEmit 2>&1 | tail -n3 || true) | sed 's/^/  /'
echo "backend test:"
(cd server && npx tsc --noEmit >/dev/null 2>&1; NODE_ENV=test node --test dist/tests 2>&1 | tail -n5 || true) | sed 's/^/  /'

echo
echo "== deployed runtime parity =="
echo "frontend dev server vendor/manifest bundle entries:"
(cd client && npx vite build --mode development --emptyOutDir >/dev/null 2>&1; ls dist/assets/*.js 2>/dev/null | wc -l | tr -d ' ') && echo " entry chunks (dev mode build)"
echo
echo "snapshot complete"
