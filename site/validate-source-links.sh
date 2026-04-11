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
ASSET_REFS_LIST="$(mktemp)"
trap 'rm -f "${FILES_LIST}" "${INDEX_LIST}" "${REFS_LIST}" "${ASSET_REFS_LIST}"' EXIT

find "${SOURCE_ROOT}" -type f | LC_ALL=C sort > "${FILES_LIST}"
python3 -m json.tool "${INDEX_FILE}" >/dev/null
python3 - "${INDEX_FILE}" <<'PY' | LC_ALL=C sort > "${INDEX_LIST}"
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    paths = json.load(fh)
if not isinstance(paths, list):
    raise SystemExit(f"{sys.argv[1]} must contain a JSON array")
for path in paths:
    if not isinstance(path, str):
        raise SystemExit(f"{sys.argv[1]} entries must be strings")
    print(path)
PY

if ! cmp -s "${FILES_LIST}" "${INDEX_LIST}"; then
  echo "${INDEX_FILE} is out of sync with ${SOURCE_ROOT}"
  diff -u "${FILES_LIST}" "${INDEX_LIST}" | sed -n '1,80p'
  exit 1
fi

SITE_PAGES=(
  "index.html"
  "zh/index.html"
)

{
  for file in "${SITE_PAGES[@]}"; do
    [ -f "${file}" ] || continue
    python3 - "${file}" <<'PY'
from html.parser import HTMLParser
from pathlib import PurePosixPath
from urllib.parse import urlparse, unquote
import sys


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, _tag, attrs):
        attrs = dict(attrs)
        for name in ("href", "src"):
            value = attrs.get(name)
            if value:
                self.refs.append(value)


def normalize(page_path, raw_url):
    parsed = urlparse(raw_url.strip())
    if parsed.scheme or parsed.netloc or raw_url.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    if raw_url.startswith("/"):
        return f"OUT_OF_BOUNDS:{raw_url}"

    page_dir = str(PurePosixPath(page_path).parent)
    if page_dir == ".":
        page_dir = ""
    joined = PurePosixPath(page_dir) / unquote(parsed.path)
    normalized = str(PurePosixPath(joined))

    if normalized == ".." or normalized.startswith("../"):
        return f"OUT_OF_BOUNDS:{raw_url}"
    return normalized


page = sys.argv[1]
with open(page, "r", encoding="utf-8") as fh:
    parser = AssetParser()
    parser.feed(fh.read())

for ref in parser.refs:
    path = normalize(page, ref)
    if path:
        print(f"{page}\t{path}")
PY
  done
} | LC_ALL=C sort -u > "${ASSET_REFS_LIST}"

missing_assets=0
while IFS="$(printf '\t')" read -r page path; do
  [ -n "${path}" ] || continue
  if [ ! -e "${path}" ]; then
    if [[ "${path}" == OUT_OF_BOUNDS:* ]]; then
      ref="${path#OUT_OF_BOUNDS:}"
      echo "Out-of-bounds site asset reference: ${ref} (from ${page})"
    else
      echo "Missing site asset reference: ${path} (from ${page})"
    fi
    missing_assets=1
  fi
done < "${ASSET_REFS_LIST}"

if [ "${missing_assets}" -ne 0 ]; then
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
import posixpath
import re
import sys

SOURCE_ROOT = "source/claude-code-source"
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

    def checked_source_path(candidate):
        normalized = posixpath.normpath(candidate)
        if normalized == SOURCE_ROOT or normalized.startswith(f"{SOURCE_ROOT}/"):
            return normalized
        return f"OUT_OF_BOUNDS:{raw_path}"

    if path.startswith("source/"):
        return checked_source_path(path)
    if path.startswith("claude-code-source/"):
        return checked_source_path(f"source/{path}")
    if path.startswith(("src/", "vendor/", "stubs/")):
        return checked_source_path(f"{SOURCE_ROOT}/{path}")
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
    if [[ "${path}" == OUT_OF_BOUNDS:* ]]; then
      ref="${path#OUT_OF_BOUNDS:}"
      echo "Out-of-bounds source reference: ${ref}"
    else
      echo "Missing source reference: ${path}"
    fi
    missing=1
  fi
done < "${REFS_LIST}"

if [ "${missing}" -ne 0 ]; then
  exit 1
fi

REF_COUNT="$(wc -l < "${REFS_LIST}" | tr -d ' ')"
ASSET_REF_COUNT="$(wc -l < "${ASSET_REFS_LIST}" | tr -d ' ')"
FILE_COUNT="$(wc -l < "${FILES_LIST}" | tr -d ' ')"
echo "Validated ${REF_COUNT} source references, ${ASSET_REF_COUNT} site asset references, and ${FILE_COUNT} indexed source files"
