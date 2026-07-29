# Public synthetics × Cloudflare bot challenge

## Symptom

`Public synthetics` fails at the first request with HTTP 403 — but only from
GitHub Actions. The same `ops/synthetic-check.sh` returns 200 from dookie and
from a browser.

## Root cause (proven, not guessed)

`aurora.tootie.tv` is proxied through **Cloudflare** (the `tootie.tv` zone;
`dinglebear.ai` is *not* proxied — it answers straight from nginx/SWAG). A
diagnostic run from a GitHub runner captured:

- runner egress IP `52.173.163.133` → `AS8075 Microsoft Corporation` (GitHub
  Actions runs on Azure)
- response: `HTTP 403`, `cf-mitigated: challenge`, body
  `<title>Just a moment…</title>` with `cType: 'managed'`, `cZone: 'aurora.tootie.tv'`
  — a **Cloudflare Managed Challenge**
- the same runner IP with a browser User-Agent → still 403 (so it is not the
  User-Agent)
- the same runner hitting `dinglebear.ai` → 200, `server: nginx` (so it is
  specifically the Cloudflare layer, not the origin or the app)

Cloudflare challenges the request because it comes from a hosting-provider ASN
(Azure). `curl` cannot solve a JS challenge, so every HTTP check 403s.
Residential IPs (dookie, a browser) are not challenged, which is why it passes
everywhere except CI.

## Fix — narrow, header-matched Skip rule

Keep every check on the real public path (Cloudflare + TLS + edge, exactly what
a *public* synthetic should test). Let only this monitor through the bot
challenge, by a shared secret it carries in a header. This is a single-secret
match, not an IP/ASN allowlist — no broad WAF bypass.

Two coordinated parts:

### 1. Repo (this PR)

- `ops/synthetic-check.sh` sends `x-aurora-synthetic: $AURORA_SYNTHETIC_TOKEN`
  on every request when the env var is set (backward-compatible: unset → no
  header → unchanged, so local runs and the un-proxied `dinglebear.ai` step are
  unaffected).
- `.github/workflows/synthetics.yml` passes
  `AURORA_SYNTHETIC_TOKEN: ${{ secrets.AURORA_SYNTHETIC_TOKEN }}` to the
  `aurora.tootie.tv` step only.

### 2. GitHub secret + Cloudflare rule (operator — one time)

Generate one token, set it in both places:

```bash
# generate + set the GitHub Actions secret (the workflow reads this)
TOKEN="$(openssl rand -hex 24)"
gh secret set AURORA_SYNTHETIC_TOKEN --repo dinglebear-ai/aurora --body "$TOKEN"
echo "Cloudflare rule value: $TOKEN"   # paste into the rule below, then clear scrollback
```

In the Cloudflare dashboard for the **tootie.tv** zone →
**Security → WAF → Custom rules → Create rule**:

- **Field / expression:**
  `(http.request.headers["x-aurora-synthetic"][0] eq "<TOKEN>")`
- **Action:** `Skip`
- **Skip:** check **Super Bot Fight Mode** (and **Bot Fight Mode** if shown);
  also skip **Security Level** to be safe.
- Deploy, and place it above other custom rules.

(Equivalent API path: create/patch the zone's
`http_request_firewall_custom` ruleset with an `action: "skip"` rule whose
`action_parameters.products` include `["bic","hot","securityLevel","uaBlock",
"zoneLockdown"]` / SBFM as available. The SWAG DNS-01 token cannot do this —
it lacks firewall scope — so use the dashboard or a firewall-scoped token.)

## Verify

After both parts are in place, re-run the workflow and confirm green:

```bash
gh workflow run synthetics.yml --repo dinglebear-ai/aurora
gh run watch "$(gh run list --workflow synthetics.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

## Alternative (rejected)

Pointing the checks at the origin over Tailscale would dodge Cloudflare, but
then the synthetic no longer tests the public edge or its TLS — the whole point
of a *public* synthetic. The TLS check already survives the challenge on its own
(openssl reads the cert at handshake time, before the HTTP 403), so only the
four HTTP checks need the header.

## Resolution (2026-07-29) — self-hosted runners instead of the Skip rule

The workflow now runs on the org's self-hosted runner farm
(`runs-on: [self-hosted, unraid]`, `tootie-ci-runner-1..4`). Their egress is
the residential ISP that Cloudflare already does not challenge, so no Skip
rule is required and the workflow no longer sends the bypass header. This
still tests the genuine public path: tootie resolves `aurora.tootie.tv` to
Cloudflare anycast IPs (`104.21.x` / `172.67.x`), not a LAN rewrite, so DNS,
the Cloudflare edge, SWAG, TLS, and the app are all in the loop.

The `AURORA_SYNTHETIC_TOKEN` repository secret exists (set 2026-07-28; value
stashed in `~/.config/aurora/synthetic-token.txt` on dookie, mode 0600) but is
dormant. The header-matched Skip rule above remains the documented path if
these checks ever move back to GitHub-hosted runners.
