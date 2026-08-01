#!/usr/bin/env sh

set -eu

TOOL_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Install Node.js 18 or later and try again." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 [--quality=80] <png...>" >&2
  exit 1
fi

exec node "$TOOL_DIR/convert-operator-avatars.mjs" "$@"
