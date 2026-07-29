#!/usr/bin/env bash
set -euo pipefail

repo="${AURORA_GITHUB_REPOSITORY:-dinglebear-ai/aurora}"
name="main requires tested delivery"
ruleset_id="$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id" | head -1)"

if [[ -n "$ruleset_id" ]]; then
  gh api --method PUT "repos/$repo/rulesets/$ruleset_id" --input ops/github/main-ruleset.json
else
  gh api --method POST "repos/$repo/rulesets" --input ops/github/main-ruleset.json
fi

echo "Applied protected-main ruleset to $repo."
