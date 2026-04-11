set -eu

cd "$(dirname "$0")"

(
  cd site
  bash build-all.sh
)

git diff --check
