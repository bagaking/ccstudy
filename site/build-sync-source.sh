#!/bin/bash
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SITE_DIR}/.." && pwd)"
SRC_DIR="${ROOT_DIR}/source/claude-code-source"
DST_DIR="${SITE_DIR}/source/claude-code-source"

if [ ! -d "${SRC_DIR}" ]; then
  echo "Missing source tree: ${SRC_DIR}"
  exit 1
fi

mkdir -p "${SITE_DIR}/source"
rm -rf "${DST_DIR}"
cp -R "${SRC_DIR}" "${DST_DIR}"

FILE_COUNT=$(find "${DST_DIR}" -type f | wc -l | tr -d ' ')
echo "Synced full source tree to site/source/claude-code-source (${FILE_COUNT} files)"
