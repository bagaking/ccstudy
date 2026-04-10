set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SITE_DIR}"

SOURCE_ROOT="source/claude-code-source"
INDEX_FILE="source-index.json"

if [ ! -d "${SOURCE_ROOT}" ]; then
  echo "Missing synced source tree: ${SOURCE_ROOT}"
  exit 1
fi

if [ ! -f "${INDEX_FILE}" ]; then
  echo "Missing source index: ${INDEX_FILE}"
  exit 1
fi

FILES_LIST="$(mktemp)"
INDEX_LIST="$(mktemp)"
REFS_LIST="$(mktemp)"
trap 'rm -f "${FILES_LIST}" "${INDEX_LIST}" "${REFS_LIST}"' EXIT

find "${SOURCE_ROOT}" -type f | LC_ALL=C sort > "${FILES_LIST}"
python3 -m json.tool "${INDEX_FILE}" >/dev/null
python3 - "${INDEX_FILE}" <<'PY' | LC_ALL=C sort > "${INDEX_LIST}"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    for path in json.load(fh):
        print(path)
PY

if ! cmp -s "${FILES_LIST}" "${INDEX_LIST}"; then
  echo "${INDEX_FILE} is out of sync with ${SOURCE_ROOT}"
  diff -u "${FILES_LIST}" "${INDEX_LIST}" | sed -n '1,80p'
  exit 1
fi

HTML_FILES=(
  "_base.html"
  "_footer.html"
  "modules/"*.html
  "zh/_base.html"
  "zh/_footer.html"
  "zh/modules/"*.html
)

{
  for file in "${HTML_FILES[@]}"; do
    [ -f "${file}" ] || continue
    python3 - "${file}" <<'PY'
import html
import re
import sys

SOURCE_REF_RE = re.compile(
    r"(?:`([^`]+)`|data-open-file=[\"']([^\"']+)[\"']|source/claude-code-source/[A-Za-z0-9_@./+-]+)"
)


def normalize(raw_path):
    if not raw_path:
        return None
    trailing_punctuation = r"[),.;:]+$"
    path = html.unescape(str(raw_path).strip())
    path = re.sub(r"^`|`$", "", path)
    if path.startswith("./"):
        path = path[2:]
    path = path.lstrip("/")
    path = re.sub(trailing_punctuation, "", path)

    if path.startswith("source/"):
        return path
    if path.startswith("claude-code-source/"):
        return f"source/{path}"
    if path.startswith(("src/", "vendor/", "stubs/")):
        return f"source/claude-code-source/{path}"
    return None


with open(sys.argv[1], "r", encoding="utf-8") as fh:
    text = fh.read()

for match in SOURCE_REF_RE.finditer(text):
    raw = next((group for group in match.groups() if group), match.group(0))
    path = normalize(raw)
    if path:
        print(path)
PY
  done
} | LC_ALL=C sort -u > "${REFS_LIST}"

missing=0
while IFS= read -r path; do
  [ -n "${path}" ] || continue
  if [ ! -e "${path}" ]; then
    echo "Missing source reference: ${path}"
    missing=1
  fi
done < "${REFS_LIST}"

if [ "${missing}" -ne 0 ]; then
  exit 1
fi

REF_COUNT="$(wc -l < "${REFS_LIST}" | tr -d ' ')"
FILE_COUNT="$(wc -l < "${FILES_LIST}" | tr -d ' ')"
echo "Validated ${REF_COUNT} source references and ${FILE_COUNT} indexed source files"
