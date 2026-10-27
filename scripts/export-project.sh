#!/usr/bin/env bash
set -euo pipefail

archive="KannadaMitra-submission.zip"
rm -f "$archive"

zip -r "$archive" . \
  -x "./node_modules/*" "*/node_modules/*" \
  "./.git/*" "*/.git/*" \
  "./.local/*" \
  "./artifacts/*/dist/*" "*/dist/*" \
  "./.cache/*" "*/.cache/*" \
  "./.env" "./.env.*" "*/.env" "*/.env.*" \
  "*.zip"

printf 'Created %s\n' "$archive"
