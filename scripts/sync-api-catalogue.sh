#!/usr/bin/env bash
# Copy the API catalogue from a sibling Graft checkout, then regenerate the reference.
# Run `npm run api:catalogue` in ../graft first if its routes have changed.
set -euo pipefail
SRC="${GRAFT_DIR:-../graft}/src/lib/admin/api-catalogue.json"
cp "$SRC" data/api-catalogue.json
node scripts/generate-api-reference.mjs
