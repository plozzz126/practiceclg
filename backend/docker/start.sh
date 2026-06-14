#!/bin/sh
set -eu

status=0
output="$(migrate -path /app/migrations -database "$DATABASE_URL" up 2>&1)" || status=$?

case "$output" in
  *"no change"*)
    status=0
    ;;
esac

if [ "$status" -ne 0 ]; then
  echo "$output"
  exit "$status"
fi

if [ -n "$output" ]; then
  echo "$output"
fi

exec /app/server
