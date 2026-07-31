---
title: Immutable deployment and rollback
created: 2026-07-30
updated: 2026-07-30
---

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
2. scans the exact digest for high/critical vulnerabilities;
3. points `latest` at that already-scanned digest; and
4. uploads `image-ref.txt` and `source-sha.txt` together.

Cosign signing, BuildKit provenance and the SPDX SBOM were removed. They exist so
third parties can independently verify a published artifact; nothing outside this
repository consumes Aurora's image, and the only verifier was `ops/deploy.sh`
checking a signature the same pipeline had just produced. Integrity comes from
the immutable digest pin plus the Trivy gate above.

`latest` is informational. Deployment always consumes `image-ref.txt`.

## One-time repository and host setup

1. Protect `main` and require the four CI checks: `Workflow and dependency
   policy`, `OSV dependency scan`, `Web, registry, and standalone`, and `Android
   app and library variants`. Do not permit direct bypass for routine releases.
   The reviewed ruleset is tracked at `ops/github/main-ruleset.json`; apply it
   deliberately with `ops/github/apply-main-ruleset.sh` after authenticating `gh`.
2. Failure notification is GitHub's own — it emails the actor when a workflow
   fails. The `AURORA_ALERT_WEBHOOK_URL` steps were removed: the secret was
   never set, so every "alert" was a no-op that made three workflows look
   monitored while `publish.yml` stayed broken for a week unnoticed.
3. On dookie, create `jakenet` if it does not exist and install Docker Compose.
   Keep the deployment env file outside the checkout.
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

The `ops/install-monitor.sh` systemd watchdog was removed. It was never
installed on dookie — `aurora-monitor.timer` did not exist there — and its
`AURORA_ALERT_WEBHOOK_URL` was never set, so it could not have paged anyone. CI
was running a unit test for it. Container health is covered by the Compose
`HEALTHCHECK` and the twice-hourly synthetics above.

Docker retains at most five 10 MiB production log files; the container is
limited to 1 GiB, 2 CPUs, and 128 PIDs with all capabilities dropped and a
read-only root filesystem.
