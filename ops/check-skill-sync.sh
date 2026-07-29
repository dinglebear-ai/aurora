#!/usr/bin/env bash
set -euo pipefail

canonical=plugin/skills/aurora/SKILL.md
generated=SKILL.md

if ! cmp --silent "$canonical" <(sed 's#plugin/skills/aurora/references/#references/#g' "$generated"); then
  echo "$generated is stale; regenerate it from $canonical" >&2
  exit 1
fi

# The cmp above is the real check: two copies of the skill exist and must not
# drift. Removed from here were greps asserting the canonical skill mentions
# three specific paths and does not contain the string "badgeVariants" — prose
# assertions that fail on rewording rather than on breakage, and go stale the
# moment the underlying files are renamed.

echo "Root and packaged Aurora skills match the canonical source."
