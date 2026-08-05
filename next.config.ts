import type { NextConfig } from "next";

// AURORA_DEV_ORIGIN: LAN or tailnet host that the dev server accepts CORS
// requests from. Defaults to the tootie LAN address (10.1.0.6) used in the
// homelab reverse-proxy setup; set to a tailnet hostname (e.g.
// tootie.manatee-triceratops.ts.net) when Tailscale is preferred.
const DEV_ORIGIN = process.env.AURORA_DEV_ORIGIN ?? "10.1.0.6";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // SWAG's aurora conf matches `server_name aurora.*`, so every domain it
  // serves answers on an `aurora.` subdomain — aurora.dinglebear.ai as much as
  // aurora.tootie.tv. An origin missing here is not a visible error: Next
  // refuses to serve /_next/ chunks, the page renders server-side and never
  // hydrates, and components read as blank rather than broken.
  allowedDevOrigins: [
    "aurora.tootie.tv",
    "aurora.dinglebear.ai",
    DEV_ORIGIN,
    "dinglebear.ai",
    "www.dinglebear.ai",
  ],
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Disable Turbopack's persistent filesystem cache for `next dev` (default-on since
    // Next 16.1.0). Its embedded cache DB deadlocks under the dev container's polling
    // bind-mount setup ("Compaction failed: Another write batch ... is already active"),
    // wedging the dev server while it keeps the port held (2026-06-01 incident).
    // In-memory caching still applies; only cross-restart persistence is dropped.
    turbopackFileSystemCacheForDev: false,
  },
  async rewrites() {
    // Content-negotiation: the root "/" serves both the browser landing page
    // and the shadcn registry JSON from the same URL.
    //
    // The shadcn CLI sends either:
    //   Accept: application/vnd.shadcn.v1+json   (current shadcn ≥ 2.x)
    //   User-Agent: shadcn                        (older / fallback)
    //
    // Matching requests are rewritten to /r/registry.json (the pre-built
    // registry manifest under public/r/). Browser requests — which send a
    // normal text/html Accept — are unaffected and get the Next.js page.
    //
    // The Vary: Accept, User-Agent header in headers() below tells CDNs and
    // proxies that the response differs by these headers so they don't serve
    // the wrong variant from cache.
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*)application/vnd\\.shadcn\\.v1\\+json(.*)",
            },
          ],
          destination: "/r/registry.json",
        },
        {
          source: "/",
          has: [
            {
              type: "header",
              key: "user-agent",
              value: "shadcn",
            },
          ],
          destination: "/r/registry.json",
        },
      ],
      fallback: [
        {
          source: "/catalog/:path*",
          destination: "/catalog/index.html",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/catalog",
        destination: "/catalog/aurora-button",
        permanent: false,
      },
      {
        source: "/catalog/",
        destination: "/catalog/aurora-button",
        permanent: false,
      },
      // young_office: a static HTML project co-hosted under /young_office/.
      // Next.js serves index.html only when the path ends in the filename;
      // these non-permanent redirects handle bare directory access so the
      // browser resolves relative asset paths correctly. Change to permanent
      // (308) once the path is stable and caching is desired.
      {
        source: "/young_office",
        destination: "/young_office/index.html",
        permanent: false,
      },
      {
        source: "/young_office/",
        destination: "/young_office/index.html",
        permanent: false,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      },
      { key: "X-Aurora-Revision", value: process.env.AURORA_BUILD_SHA ?? "development" },
    ];

    return [
      // Baseline security headers for all routes.
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Preserve content-negotiation Vary on the root route.
      {
        source: "/",
        headers: [{ key: "Vary", value: "Accept, User-Agent" }],
      },
      {
        source: "/catalog/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/catalog/:item",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },
      // Registry names are intentionally mutable discovery URLs. Production
      // consumers pin the Git commit URL documented in docs/versioning.md.
      {
        source: "/r/:path*.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300, stale-while-revalidate=86400, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
