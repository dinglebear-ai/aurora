# Pin by digest so builds are reproducible; bump with `docker pull node:24-alpine`
# then update the digest here and in the runner stage.
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

FROM base AS deps

# Install AS node so every one of the ~93k node_modules files is *created* owned
# by node. Chowning them afterwards is what made the dev image take 30+ minutes:
# on overlayfs a chown cannot just touch metadata, it forces a copy-up of each
# file into the upper layer — 1.8G duplicated, on a Docker root backed by ZFS.
# Measured: `RUN chown -R node:node /pnpm /app` = ~19min and still going, versus
# ~4min for every other step in the build combined.
# Chowning the two directories is non-recursive and therefore cheap.
RUN mkdir -p /pnpm /app && chown node:node /pnpm /app
USER node

# pnpm-workspace.yaml declares patchedDependencies, so pnpm hashes every file
# under patches/ during install. Without them the install aborts with ENOENT
# before it resolves anything. Copy the manifests and the patches only — not
# the sources — so this layer still caches on dependency changes alone.
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node patches ./patches
RUN pnpm install --frozen-lockfile

FROM deps AS dev

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

# --chown applies ownership as the files are written. A `RUN chown -R` here
# instead would copy up the whole inherited node_modules tree (see deps).
COPY --chown=node:node . .

RUN mkdir -p /pnpm/store /app/.next

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM base AS builder

ARG AURORA_BUILD_SHA=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV AURORA_BUILD_SHA=$AURORA_BUILD_SHA

RUN pnpm build

FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS runner

ARG AURORA_BUILD_SHA=development

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV AURORA_BUILD_SHA=$AURORA_BUILD_SHA

LABEL org.opencontainers.image.source="https://github.com/dinglebear-ai/aurora" \
  org.opencontainers.image.revision=$AURORA_BUILD_SHA

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# The standalone server only needs the Node runtime. Remove package-manager
# tooling and its dependency tree from the production image to reduce attack
# surface and prevent build-only npm/Corepack/Yarn advisories from shipping.
RUN rm -rf \
  /opt/yarn-* \
  /usr/local/lib/node_modules/corepack \
  /usr/local/lib/node_modules/npm \
  /usr/local/bin/corepack \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/local/bin/pnpm \
  /usr/local/bin/pnpx \
  /usr/local/bin/yarn \
  /usr/local/bin/yarnpkg

USER node

EXPOSE 3000

# Use 127.0.0.1, not localhost: busybox wget tries IPv6 ::1 first, but Next
# listens on IPv4 0.0.0.0 — localhost would falsely report unhealthy.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -T 5 -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
