#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
env_file="${1:-ops/compose/production.env}"

if [[ ! -f "$env_file" ]]; then
  echo "missing deployment environment file: $env_file" >&2
  exit 1
fi

set -a
# Operator-selected non-secret deployment topology.
# shellcheck disable=SC1090
source "$env_file"
set +a

: "${AURORA_IMAGE_REF:?AURORA_IMAGE_REF is required}"
: "${AURORA_EXPECTED_SHA:?AURORA_EXPECTED_SHA is required}"
: "${AURORA_BIND_ADDRESS:?AURORA_BIND_ADDRESS is required}"
: "${AURORA_TENANT_URL:?AURORA_TENANT_URL is required}"
# LEARNED: Compose accepts wildcard binds that bypass the intended SWAG-only path.
case "$AURORA_BIND_ADDRESS" in
  0.0.0.0|::|"[::]")
    echo "AURORA_BIND_ADDRESS must be a specific host address, not a wildcard" >&2
    exit 1
    ;;
esac
[[ "$AURORA_IMAGE_REF" =~ @sha256:[0-9a-f]{64}$ ]] || {
  echo "AURORA_IMAGE_REF must be an immutable sha256 digest" >&2
  exit 1
}
[[ "$AURORA_IMAGE_REF" != *'@sha256:0000000000000000000000000000000000000000000000000000000000000000' ]] || {
  echo "refusing placeholder image digest" >&2
  exit 1
}
[[ "$AURORA_EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || {
  echo "AURORA_EXPECTED_SHA must be a full 40-character Git SHA" >&2
  exit 1
}

command -v cosign >/dev/null || { echo "cosign is required" >&2; exit 1; }
# Must match the repository the publish workflow signs from — the OIDC identity
# is derived from it. Overridable via the env file so a future move needs one
# edit, not a code change.
: "${AURORA_REPO:=dinglebear-ai/aurora}"
cosign verify \
  --certificate-identity-regexp "^https://github.com/${AURORA_REPO}/.github/workflows/publish.yml@refs/heads/main\$" \
    --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
    "$AURORA_IMAGE_REF" >/dev/null

compose=(docker compose --env-file "$env_file" -f ops/compose/production.yaml)
legacy_id=""
legacy_name=""
legacy_was_running="false"
previous_image=""
previous_sha=""

wait_local_ready() {
  local attempts="${1:-30}"
  local attempt
  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl --fail --silent --show-error "http://${AURORA_BIND_ADDRESS}:${AURORA_PUBLIC_PORT:-50000}/" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback_legacy() {
  local status="$1"
  trap - EXIT
  if (( status != 0 )); then
    echo "Deployment failed; restoring last-known-good Aurora container." >&2
    if [[ -n "$previous_image" && -n "$previous_sha" ]]; then
      AURORA_IMAGE_REF="$previous_image" AURORA_EXPECTED_SHA="$previous_sha" \
        "${compose[@]}" up -d --remove-orphans >/dev/null
      if ! wait_local_ready 60; then
        echo "Last-known-good Aurora image was restored but did not become ready." >&2
      fi
    elif [[ -n "$legacy_id" ]]; then
      "${compose[@]}" down --remove-orphans >/dev/null 2>&1 || true
      if [[ -n "$legacy_name" ]] && docker container inspect "$legacy_name" >/dev/null 2>&1; then
        docker rename "$legacy_name" aurora
      fi
      if [[ "$legacy_was_running" == "true" ]] && docker container inspect aurora >/dev/null 2>&1; then
        docker start aurora >/dev/null
        wait_local_ready 60 || echo "Legacy Aurora container restarted but did not become ready in time." >&2
      fi
    else
      echo "No prior Aurora deployment was available to restore." >&2
    fi
  fi
  exit "$status"
}
trap 'rollback_legacy $?' EXIT

"${compose[@]}" pull

# The former development topology used the same fixed container name under the
# `aurora` Compose project. Preserve it as a stopped rollback candidate while
# the immutable production project takes ownership of the public port/name.
if docker container inspect aurora >/dev/null 2>&1; then
  existing_project="$(docker container inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' aurora 2>/dev/null || true)"
  if [[ "$existing_project" == "aurora-production" ]]; then
    candidate_previous_image="$(docker container inspect --format '{{.Config.Image}}' aurora)"
    candidate_previous_sha="$(docker container inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' aurora)"
    [[ "$candidate_previous_image" =~ @sha256:[0-9a-f]{64}$ && "$candidate_previous_sha" =~ ^[0-9a-f]{40}$ ]] || {
      echo "running production container lacks a valid rollback digest/revision" >&2
      exit 1
    }
    previous_image="$candidate_previous_image"
    previous_sha="$candidate_previous_sha"
  else
    legacy_id="$(docker container inspect --format '{{.Id}}' aurora)"
    legacy_name="aurora-legacy-${legacy_id:0:12}"
    legacy_was_running="$(docker container inspect --format '{{.State.Running}}' aurora)"
    if [[ "$legacy_was_running" == "true" ]]; then
      docker stop aurora >/dev/null
    fi
    docker rename aurora "$legacy_name"
  fi
fi

"${compose[@]}" up -d --remove-orphans
if ! wait_local_ready 30; then
  docker logs --tail 100 aurora >&2 || true
  false
fi
AURORA_PUBLIC_URL="${AURORA_PUBLIC_URL:-https://aurora.tootie.tv}" \
  AURORA_EXPECTED_SHA="$AURORA_EXPECTED_SHA" \
  ops/synthetic-check.sh
AURORA_PUBLIC_URL="$AURORA_TENANT_URL" \
  AURORA_EXPECTED_SHA="$AURORA_EXPECTED_SHA" \
  ops/synthetic-check.sh

if [[ -n "$legacy_name" ]]; then
  docker rm "$legacy_name" >/dev/null
fi
trap - EXIT

echo "Deployed and verified $AURORA_IMAGE_REF ($AURORA_EXPECTED_SHA)."
