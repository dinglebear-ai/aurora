#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_file=ops/compose/production.yaml
env_file=ops/compose/production.env.example

docker compose --env-file "$env_file" -f "$compose_file" config --quiet
rendered="$(docker compose --env-file "$env_file" -f "$compose_file" config)"

grep -q 'read_only: true' <<<"$rendered"
grep -q 'no-new-privileges:true' <<<"$rendered"
grep -q 'name: jakenet' <<<"$rendered"
grep -q 'host_ip: 100.88.16.79' <<<"$rendered"
grep -q 'published: "50000"' <<<"$rendered"
grep -Eq 'ghcr\.io/dinglebear-ai/aurora@sha256:[0-9a-f]{64}' <<<"$rendered"

# Assert that templates retain literal placeholders.
# shellcheck disable=SC2016
grep -q '\${AURORA_UPSTREAM_HOST}' ops/swag/aurora.subdomain.conf.template
# Assert that templates retain literal placeholders.
# shellcheck disable=SC2016
grep -q '\${AURORA_PUBLIC_PORT}' ops/swag/aurora.subdomain.conf.template
grep -q 'server_name dinglebear.ai www.dinglebear.ai' ops/swag/dinglebear.subdomain.conf.template

if grep -Eq '(^|[[:space:]])host_ip:[[:space:]]+(0\.0\.0\.0|::)([[:space:]]|$)' <<<"$rendered"; then
  echo "production port must not bind a wildcard host address" >&2
  exit 1
fi

echo "Production Compose and SWAG topology contract is valid."
