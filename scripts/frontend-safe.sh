#!/bin/sh
set -eu

MODE="${1:-}"
shift || true

if [ -z "$MODE" ]; then
  echo "usage: sh ./scripts/frontend-safe.sh <dev|build|lint|start> [args...]" >&2
  exit 1
fi

RAW_SCRIPT="${MODE}:raw"

if [ "${DEVLINK_SAFE_FRONTEND:-0}" = "1" ]; then
  exec npm run "$RAW_SCRIPT" -- "$@"
fi

CURRENT_DIR=$(pwd)

case "$CURRENT_DIR" in
  *\\*)
    TARGET="${TMPDIR:-/tmp}/practiceclg-run"
    echo "Detected unsupported path for Next.js tooling, mirroring frontend to $TARGET" >&2
    mkdir -p "$TARGET"
    rsync -a --delete --exclude '.next' --exclude 'node_modules' --exclude '.runtime' ./ "$TARGET/"
    if [ ! -d "$TARGET/node_modules" ]; then
      echo "Installing frontend dependencies in mirrored workspace..." >&2
      (cd "$TARGET" && npm install)
    fi
    cd "$TARGET"
    exec env DEVLINK_SAFE_FRONTEND=1 npm run "$MODE" -- "$@"
    ;;
  *)
    exec env DEVLINK_SAFE_FRONTEND=1 npm run "$MODE" -- "$@"
    ;;
esac
