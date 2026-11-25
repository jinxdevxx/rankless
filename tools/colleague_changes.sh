#!/usr/bin/env bash
# Lists commits on origin/main since the last check that were not made by Claude
# (Claude's commits carry a "Claude-Session:" trailer). Prints nothing if there are none.
# The last checked commit is stored locally in git config (rankless.colleagueCheck).
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch -q --depth=200 origin main
head=$(git rev-parse origin/main)
last=$(git config --get rankless.colleagueCheck || true)
git config rankless.colleagueCheck "$head"
[ -z "$last" ] && exit 0
[ "$last" = "$head" ] && exit 0
git merge-base --is-ancestor "$last" "$head" 2>/dev/null || last="$head~20"
for c in $(git rev-list --reverse "$last..$head"); do
  if git log -1 --format=%B "$c" | grep -q "Claude-Session:"; then continue; fi
  git log -1 --date=format:'%d.%m. %H:%M' --format='• %ad · %an: %s' "$c"
  git show --stat=80 --format='' "$c" | sed -e '$!s/^/    /' -e '$s/^ */    → /'
done
