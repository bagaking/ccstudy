#!/bin/bash
set -euo pipefail

if [ ! -f "_base.html" ] || [ ! -f "_footer.html" ]; then
  echo "Missing _base.html or _footer.html in site/."
  exit 1
fi

if [ ! -d "modules" ] || ! ls modules/*.html >/dev/null 2>&1; then
  echo "No module files found in site/modules/."
  exit 1
fi

bash build-sync-source.sh

cat _base.html modules/*.html _footer.html > index.html
echo "Built site/index.html"
