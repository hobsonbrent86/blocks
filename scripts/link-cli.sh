#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npx pnpm@9.15.0 install
npx pnpm@9.15.0 -r run build
cd packages/cli
npm link
echo ""
echo "✓ blocks CLI linked globally"
echo "  Try: blocks init --path /tmp/my-blocks-app"
