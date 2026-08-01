#!/usr/bin/env sh

TOOL_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
"$TOOL_DIR/convert-operator-avatars.sh" "$@"
EXIT_CODE=$?

printf "\nPress Enter to close..."
read -r _
exit "$EXIT_CODE"
