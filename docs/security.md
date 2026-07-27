# Security Posture

This document describes the known security characteristics and limitations of
the Aurora Design System across its surfaces (web registry site, Android client,
and the Codex tooling). It is intentionally factual and concise. No secret
values are recorded here.

## Web app / registry site

The Aurora site is a **public shadcn-compatible registry and gallery**. Its
content is generated from repository sources, but HTML is request-rendered to
support CSP nonces. It serves component JSON payloads and documentation. There
is **no server-side authentication and no user data** — it stores no credentials,
sessions, or personally identifiable information. The same applies to the
co-hosted registry/marketplace pages.

### HTTP security headers

The Next.js app (`next.config.ts`) sets a baseline of security headers on **all
routes** (`source: "/(.*)"`):

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Content-Security-Policy` | per-request nonce policy; see below |
| `X-Aurora-Revision` | full CI-tested source SHA in published images |

The Content-Security-Policy is:

```
default-src 'self';
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
script-src 'self' 'nonce-<per-request-value>' 'strict-dynamic';
connect-src 'self';
form-action 'self';
frame-ancestors 'self';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests
```

`proxy.ts` generates a cryptographically random nonce for every request, passes
the CSP and `x-nonce` to Next.js so framework hydration scripts receive it, and
sets the same policy on the response. Production rejects script
`unsafe-inline`; development alone adds `unsafe-eval` for the Next debug
runtime. `app/layout.tsx` forces request rendering because a statically rendered
page cannot receive a per-request nonce.

### URL-bearing component trust contract

Registry components that turn data into links accept only absolute `http:` and
`https:` URLs. Malformed, relative, `javascript:`, `data:`, and other schemes are
rendered without an actionable link. This applies to citations, sources,
sandbox previews, chat-message citations, and web previews. Applications should
still treat labels and descriptions as untrusted display text.

**Known relaxation:**

- `style-src 'unsafe-inline'` is required because Aurora uses inline
  `style={}` attributes extensively across components.
The existing root-route `Vary: Accept, User-Agent` header (used by the shadcn
content-negotiation rewrite) is preserved alongside these headers.

## Android client

The Android client encrypts its secrets **at rest** (`app/data/AppSettings.kt`).
The secret values — the bearer auth token, the API key, the ChatGPT access
token, and the ChatGPT account id — are encrypted with **AES-256/GCM** using a
key held in the **AndroidKeyStore**. The application receives only a key handle
and does not export key material. The implementation does **not** require or
attest StrongBox/TEE hardware backing, so devices may provide software-backed
KeyStore storage. Only the resulting ciphertext (`Base64(IV ‖ ciphertext +
GCM tag)`) is written to the plaintext DataStore file. A failed encrypt refuses
to persist the credential (the setter throws rather than silently storing
plaintext).

Residual limitations, stated plainly:

- The KeyStore key is **not bound to user authentication** —
  `setUserAuthenticationRequired` is not set, so decryption does not require a
  device unlock / biometric and the key is usable whenever the app process can
  reach the KeyStore.
- Decryption is **intentionally lenient**: any value that is not valid
  ciphertext for the current key (legacy plaintext, a corrupted entry, or a
  value encrypted under a since-invalidated key) decodes to `null` and is
  treated as "no value" rather than raising an error. This keeps first-run,
  migration, and key-reset graceful, but means a tampered or unreadable entry
  fails open to "absent" instead of failing loudly.
- The encryption path is currently **not covered by automated tests** (no
  Robolectric/instrumentation harness exercises the AndroidKeyStore) — a known,
  accepted gap.

## Codex WebSocket

The Codex tooling connects over a WebSocket. The default server URL is the
cleartext, emulator-local `ws://10.0.2.2:4500` (`10.0.2.2` is the Android
emulator alias for the host machine's loopback). Cleartext is permitted **only
for local/dev hosts**, scoped via `network_security_config.xml`.

Remote endpoints are **not** auto-upgraded to TLS. Aurora instead enforces one
fail-closed application policy (`app/net/ServerUrlPolicy.kt`) across every
supported Android API level:

- Remote endpoints must use `wss://`.
- Cleartext `ws://` is accepted only for `10.0.2.2`, `127.0.0.1`, `localhost`,
  and IPv6 loopback.
- Malformed URLs, unsupported schemes, embedded credentials, missing hosts,
  invalid ports, and fragment-bearing URLs are rejected.

The same policy is applied when a stored URL is read (invalid legacy values
fall back to the emulator-local default), when Settings validates and persists
a URL, when reconnect flows construct a client, and again inside `CodexClient`
before OkHttp receives the request. The platform network security configuration
remains a second layer of defense for cleartext traffic; it is no longer relied
on to close the API 24–27 gap.

There is currently **no certificate pinning** on that connection — this remains
a known limitation.

## Delivery and dependency controls

All third-party Actions are pinned to reviewed commits (container actions to an
image digest) and CI enforces that rule. OSV scans the pnpm lockfile. Published
images include provenance and SBOM attestations, receive an additional SPDX
SBOM, are scanned before promotion, and are keyless-signed. Production deploys
must use a digest and verify the GitHub Actions certificate identity before
starting the container. See `docs/deployment.md` for the exact contract.

## Reporting

For anything sensitive, do not file public issues with exploit details. Contact
the maintainer directly.
