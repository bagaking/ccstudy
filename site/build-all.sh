#!/bin/bash
set -euo pipefail

bash build.sh

if [ -f "zh/_base.html" ] && [ -f "zh/_footer.html" ] && [ -d "zh/modules" ] && ls zh/modules/*.html >/dev/null 2>&1; then
  cat zh/_base.html zh/modules/*.html zh/_footer.html > zh/index.html
  echo "Built site/zh/index.html"
else
  echo "Skip zh build: zh shell or modules not ready yet."
fi

echo "Build complete."

