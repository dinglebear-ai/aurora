#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

compose_file=ops/compose/production.yaml
env_file=ops/compose/production.env.example

# Two things are worth asserting here, and only two.
#
# 1. The Compose file plus the example env actually render. That catches real
#    breakage — a missing required variable, bad interpolation, invalid YAML.
# 2. The published port is not bound to a wildcard address. Production is meant
#    to be reachable only over the tailnet address; a wildcard bind would expose
#    it on every interface, and nothing else in the pipeline would notice.
#
# What used to live here was a list of greps asserting that the rendered output
# contained strings the Compose file literally sets a few lines away —
# read_only, the network name, the host_ip, the port, the image path, and
# placeholder text in the SWAG templates. Those restate the config rather than
# test it: editing the Compose file and editing this script are the same act, so
# the check can only ever agree with itself. It also made unrelated work fail
# for no reason — the image-path grep broke the moment the registry namespace
# changed, which had nothing to do with topology.
#
# Behaviour is covered where it belongs: ops/deploy.sh waits for the container
# to answer on the bind address and then runs ops/synthetic-check.sh against the
# real public URL.

docker compose --env-file "$env_file" -f "$compose_file" config --quiet
rendered="$(docker compose --env-file "$env_file" -f "$compose_file" config)"

if grep -Eq '(^|[[:space:]])host_ip:[[:space:]]+(0\.0\.0\.0|::)([[:space:]]|$)' <<<"$rendered"; then
  echo "production port must not bind a wildcard host address" >&2
  exit 1
fi

echo "Production Compose renders and binds a specific host address."
