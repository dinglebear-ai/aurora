# Versioning and reproducible consumption

Aurora has two deliberately different registry URL contracts.

## Mutable discovery URLs

Use `https://aurora.tootie.tv/r/<name>.json` while browsing and prototyping.
These names follow the deployed `main` revision. They are cached briefly
(`max-age=300`, `stale-while-revalidate=86400`) and can change after a release.
Next.js content-hashed `/_next/static/*` assets retain the framework's one-year
immutable cache policy; CI verifies that policy and that browser source maps are
absent. They are not registry install URLs.

## Immutable production URLs

Production consumers pin the full 40-character Git commit that they reviewed:

```bash
AURORA_SHA=<full-40-character-commit>
npx shadcn@latest add \
  "https://raw.githubusercontent.com/dinglebear-ai/aurora/${AURORA_SHA}/public/r/aurora-base.json"
```

The commit URL is content-addressed by Git. Record the SHA in the consuming
repository beside the vendored component update. Do not use a branch name or
`latest` in reproducible builds. Release tags are human-friendly aliases; the
full commit remains the authoritative pin.

Container deployments use the same rule at the image layer: deploy
`ghcr.io/dinglebear-ai/aurora@sha256:<digest>`, then verify that the served
`X-Aurora-Revision` equals the CI-tested source SHA. The publish workflow stores
the image reference, source SHA, and SPDX SBOM together as run artifacts.

## Upgrade procedure

1. Read both root `CHANGELOG.md` (site, delivery, and repository changes) and
   `registry/aurora/CHANGELOG.md` (consumer-visible component and token changes).
2. Select and review a full Aurora commit.
3. Install from the immutable raw GitHub URL.
4. Review the vendored diff; do not overwrite downstream changes blindly.
5. Run the consumer's type, build, accessibility, dark/light, and visual gates.
6. Commit the Aurora SHA with the generated component changes.

The registry changelog is authoritative for vendored API, dependency, token,
and behavior changes. The root changelog is authoritative for hosting, build,
CI, Android app, and operational changes; a release may require reading both.
