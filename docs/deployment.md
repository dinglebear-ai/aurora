# Immutable deployment and rollback

The public Aurora path is an immutable standalone Next.js image. The writable
development checkout is local-only and must never be a SWAG upstream. Pages are
request-rendered so the per-request CSP nonce can be attached to every Next.js
hydration script; do not re-enable static generation without replacing the nonce
policy with tested build-time script hashes.

## Canonical topology

| Surface | Hostnames | Runtime | Port/network |
|---|---|---|---|
| Aurora design system | `aurora.tootie.tv` | `aurora` digest-pinned production container on dookie | host `50000` to container `3000`; external `jakenet` |
| Co-hosted fleet tenant | `dinglebear.ai`, `www.dinglebear.ai` | same immutable image; host routing in `proxy.ts` | same upstream |
| Local development | no public hostname | `aurora-dev` profile with source bind mount | host `3000`; isolated `aurora-dev` network |
| Local production smoke | no public hostname | `aurora-prod-build` profile | host `50001`; isolated `aurora-prod-build` network |

The tracked production contract is `ops/compose/production.yaml`; tracked SWAG
templates are under `ops/swag/`. `ops/check-production-topology.sh` validates
that both sides agree on port, network, tenant names, digest use, and isolation.
The host port binds only to `AURORA_BIND_ADDRESS` (dookie's Tailscale address),
not a wildcard interface, so routable clients cannot bypass the SWAG ingress.

## Publish and promotion

`.github/workflows/publish.yml` runs only after the `CI` workflow succeeds for a
push to `main`. It checks out `workflow_run.head_sha`, proves the checkout, and
builds the image with that SHA. The workflow then:

1. pushes only `sha-<full-sha>`;
2. emits BuildKit provenance and SBOM attestations plus a downloadable SPDX SBOM;
3. scans the exact digest for high/critical vulnerabilities;
4. keyless-signs and verifies that digest with Cosign;
5. points `latest` at that already-scanned/signed digest; and
6. uploads `image-ref.txt`, `source-sha.txt`, and `sbom.spdx.json` together.

`latest` is informational. Deployment always consumes `image-ref.txt`.

## One-time repository and host setup

1. Protect `main` and require the four CI checks: `Workflow and dependency
   policy`, `OSV dependency scan`, `Web, registry, and standalone`, and `Android
   app and library variants`. Do not permit direct bypass for routine releases.
   The reviewed ruleset is tracked at `ops/github/main-ruleset.json`; apply it
   deliberately with `ops/github/apply-main-ruleset.sh` after authenticating `gh`.
2. Configure optional repository secret `AURORA_ALERT_WEBHOOK_URL` for CI,
   publication, and synthetic failures. The workflows still fail visibly when
   the webhook is absent.
3. On dookie, create `jakenet` if it does not exist and install Docker Compose
   plus Cosign. Keep the deployment env file outside the checkout.
4. On squirts, render the tracked SWAG templates, review the diff against the
   installed vhosts, run `nginx -t`, then atomically install/reload them. Do not
   copy an unreviewed generated file over live proxy configuration.

## Deploy a tested digest

Download `image-ref.txt` and `source-sha.txt` from the successful publish run.
Create a private environment file from the tracked example:

```bash
cp ops/compose/production.env.example ~/.config/aurora/production.env
chmod 600 ~/.config/aurora/production.env
# Replace AURORA_IMAGE_REF and AURORA_EXPECTED_SHA with the workflow outputs.
# Confirm AURORA_BIND_ADDRESS is dookie's current Tailscale address and set both
# AURORA_PUBLIC_URL and AURORA_TENANT_URL to their production HTTPS origins.
```

Validate without changing runtime state:

```bash
ops/check-production-topology.sh
docker compose --env-file ~/.config/aurora/production.env \
  -f ops/compose/production.yaml config --quiet
cosign verify \
  --certificate-identity-regexp \
  '^https://github.com/dinglebear-ai/aurora/.github/workflows/publish.yml@refs/heads/main$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  "$(sed -n 's/^AURORA_IMAGE_REF=//p' ~/.config/aurora/production.env)"
```

Deploy and verify landing HTML, shadcn content negotiation, registry schema and
the deployed revision's checksum, CSP nonce, revision header, and TLS lifetime
on both Aurora and the co-hosted dinglebear tenant:

```bash
ops/deploy.sh ~/.config/aurora/production.env
```

Only after that succeeds should SWAG public traffic point to dookie port 50000.
The dev profile remains on port 3000 and is never attached to `jakenet`.

## Rollback

`ops/deploy.sh` records the running production container's immutable image and
source revision before replacement. If local readiness or either public-host
synthetic fails, it recreates that last-known-good image automatically. For a
manual rollback, replace `AURORA_IMAGE_REF` and `AURORA_EXPECTED_SHA` in the
private env file with the prior pair and rerun the script. It verifies the old
signature before pull, recreates the service, and proves both public contracts.
If registry clients observed a mutable
asset during the incident, purge only the `/r/*` proxy cache; hashed Next assets
and immutable raw-Git URLs must not be purged.

## Monitoring

GitHub synthetics run twice per hour. They validate the live registry payload
against the full source revision reported by the deployed image, so an
intentional delay between merging and manual promotion is not reported as an
outage.

On dookie, install the tracked five-minute systemd monitor from the checkout:

```bash
sudo ops/install-monitor.sh
systemctl status aurora-monitor.timer
journalctl -u aurora-monitor.service --since today
```

Put `AURORA_ALERT_WEBHOOK_URL` and optional
`AURORA_DISK_ALERT_PERCENT`/`AURORA_MEMORY_ALERT_PERCENT` overrides in
`/etc/aurora/monitor.env` (mode 0600). The monitor discovers Docker's active
data root, fails if metrics cannot be collected, and alerts on unhealthy,
stopped, OOM-killed, disk-pressure, or memory-pressure states. Docker retains at most
five 10 MiB production log files; the container is limited to 1 GiB, 2 CPUs,
and 128 PIDs with all capabilities dropped and a read-only root filesystem.
