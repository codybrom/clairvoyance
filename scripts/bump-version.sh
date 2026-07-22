#!/bin/bash
# Sync the plugin version across every manifest that carries one.
#
# Usage:
#   scripts/bump-version.sh <new-version>   set the version everywhere
#   scripts/bump-version.sh --check         verify all manifests agree (CI)
#
# Add new manifests to TARGETS as "file|jq-path" pairs.

set -euo pipefail
cd "$(dirname "$0")/.."

TARGETS=(
  "package.json|.version"
  ".claude-plugin/plugin.json|.version"
  ".claude-plugin/marketplace.json|.plugins[0].version"
  ".codex-plugin/plugin.json|.version"
  ".cursor-plugin/plugin.json|.version"
  ".kimi-plugin/plugin.json|.version"
  "gemini-extension.json|.version"
  "docs/package.json|.version"
)

if [ "${1:-}" = "--check" ]; then
  status=0
  reference=""
  for target in "${TARGETS[@]}"; do
    file="${target%%|*}"; path="${target##*|}"
    version=$(jq -r "$path" "$file")
    [ -z "$reference" ] && reference="$version"
    if [ "$version" != "$reference" ]; then
      echo "MISMATCH: $file ($path) = $version (expected $reference)" >&2
      status=1
    else
      echo "ok: $file = $version"
    fi
  done
  exit $status
fi

VERSION="${1:?usage: bump-version.sh <new-version> | --check}"
if ! printf '%s' "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "error: '$VERSION' is not a semver version" >&2
  exit 1
fi

for target in "${TARGETS[@]}"; do
  file="${target%%|*}"; path="${target##*|}"
  tmp=$(mktemp)
  jq --indent 2 "$path = \"$VERSION\"" "$file" > "$tmp" && mv "$tmp" "$file"
  echo "set: $file ($path) -> $VERSION"
done
