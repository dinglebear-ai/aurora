#!/usr/bin/env bash
set -euo pipefail

base_url="${AURORA_PUBLIC_URL:-${1:-https://aurora.tootie.tv}}"
expected_sha="${AURORA_EXPECTED_SHA:-${2:-}}"
registry_item="${AURORA_SYNTHETIC_ITEM:-aurora-tokens.json}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

# aurora.tootie.tv is proxied through Cloudflare, whose bot protection issues a
# Managed Challenge ("Just a moment…", HTTP 403 with cf-mitigated: challenge) to
# requests from hosting-provider ASNs — which is what GitHub's Azure-hosted
# runners are. curl cannot solve a JS challenge, so every HTTP check below 403s
# from CI while passing from a residential IP. When AURORA_SYNTHETIC_TOKEN is
# set, send it as a header that a narrow Cloudflare Skip rule matches to bypass
# the bot challenge for this monitor only (see ops/synthetics-cloudflare.md).
# Unset (e.g. local runs, or an un-proxied host like dinglebear.ai) it
# adds nothing and behaviour is unchanged.
# Shared curl flags. When the bypass token is set we deliberately do NOT follow
# redirects: curl re-sends -H headers (this secret included) to the redirect
# target, even off-host, so a stray 3xx would disclose the token. The monitored
# endpoints answer 200 directly; a redirect while the token is attached is
# itself a failure — the content assertions below reject the redirect body.
# Without the token, keep --location (unchanged behaviour for local / un-proxied
# runs such as dinglebear.ai).
curl_common=(--fail --silent --show-error)
if [[ -n "${AURORA_SYNTHETIC_TOKEN:-}" ]]; then
  curl_common+=(-H "x-aurora-synthetic: ${AURORA_SYNTHETIC_TOKEN}")
else
  curl_common+=(--location)
fi

curl "${curl_common[@]}" \
  --dump-header "$tmp_dir/landing.headers" \
  --output "$tmp_dir/landing.html" "$base_url/"
grep -Eqi '^content-type:.*text/html' "$tmp_dir/landing.headers"

curl "${curl_common[@]}" \
  -H 'Accept: application/vnd.shadcn.v1+json' \
  --output "$tmp_dir/registry.json" "$base_url/"
jq -e '.items | type == "array" and length > 0' "$tmp_dir/registry.json" >/dev/null

curl "${curl_common[@]}" \
  --dump-header "$tmp_dir/item.headers" \
  --output "$tmp_dir/item.json" "$base_url/r/$registry_item"
jq -e '.name and .type and (.files | type == "array")' "$tmp_dir/item.json" >/dev/null

grep -Eqi '^content-security-policy:.*nonce-' "$tmp_dir/landing.headers"
grep -Eqi '^x-aurora-revision:' "$tmp_dir/landing.headers"
served_sha="$(sed -nE 's/^x-aurora-revision:[[:space:]]*([0-9a-f]{40})[[:space:]]*$/\1/ip' "$tmp_dir/landing.headers" | tr -d '\r' | head -1)"
[[ "$served_sha" =~ ^[0-9a-f]{40}$ ]] || {
  echo "public path did not expose a full deployed source revision" >&2
  exit 1
}
if [[ -n "$expected_sha" ]]; then
  [[ "$served_sha" == "$expected_sha" ]] || {
    echo "revision mismatch: expected $expected_sha, served $served_sha" >&2
    exit 1
  }
fi

# Compare the mutable live item to the source artifact belonging to the revision
# that is actually deployed. Comparing to the workflow checkout's current main
# creates false outages during the intentional merge-to-deploy interval.
artifact_sha="${expected_sha:-$served_sha}"
artifact_url="https://raw.githubusercontent.com/dinglebear-ai/aurora/${artifact_sha}/public/r/${registry_item}"
curl --fail --silent --show-error --location --output "$tmp_dir/expected-item.json" "$artifact_url"
expected_registry_hash="$(sha256sum "$tmp_dir/expected-item.json" | cut -d' ' -f1)"
served_registry_hash="$(sha256sum "$tmp_dir/item.json" | cut -d' ' -f1)"
[[ "$served_registry_hash" == "$expected_registry_hash" ]] || {
  echo "registry checksum mismatch for deployed revision $artifact_sha" >&2
  exit 1
}

host="${base_url#*://}"
host="${host%%/*}"
host="${host%%:*}"
expiry="$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2-)"
openssl x509 -checkend "${AURORA_TLS_MIN_SECONDS:-1209600}" -noout \
  < <(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null) >/dev/null

echo "Public path healthy: $base_url; registry=$registry_item; TLS expires=$expiry"
