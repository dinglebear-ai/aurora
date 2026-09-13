// Build a dependency-free, no-script document for Rust and other server consumers.
import { build, transform } from "esbuild"
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { createHash } from "node:crypto"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"

const root = process.cwd()
const destination = resolve(process.argv[2] || "public/oauth-document")
const temporary = await mkdtemp(join(root, ".oauth-document-"))
try {
  const entry = "registry/aurora/blocks/auth/oauth/oauth-document.tsx"
  const sources = [entry, "registry/aurora/blocks/auth/oauth/oauth-document.css", "registry/aurora/styles/aurora.css", "registry/aurora/styles/aurora-components.css", "registry/aurora/ui/button.tsx", "public/fonts/aurora/manrope-var.woff2", "public/fonts/aurora/inter-var.woff2"]
  await build({ entryPoints: [entry], bundle: true, packages: "external", platform: "node", format: "esm", outfile: join(temporary, "component.mjs"), alias: { "@": root }, jsx: "automatic" })
  const { OAuthDocument } = await import(pathToFileURL(join(temporary, "component.mjs")))
  const tokens = await readFile(sources[2], "utf8")
  // Reuse the exact light token rule for OS preference without rewriting its values.
  const light = tokens.match(/\.light\s*\{[^}]+\}/)?.[0]
  if (!light) throw new Error("Canonical light token rule not found")
  let css = tokens + "\n@media(prefers-color-scheme:light){" + light.replace(".light", ":root:not(.dark)") + "}\n" + await readFile(sources[3], "utf8") + await readFile(sources[1], "utf8")
  for (const [font, file] of [["Manrope", sources[5]], ["Inter", sources[6]]]) {
    css += `@font-face{font-family:'${font}';font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${(await readFile(file)).toString("base64")}) format('woff2');}`
  }
  await mkdir(destination, { recursive: true })
  await writeFile(join(destination, "oauth.css"), (await transform(css, { loader: "css", minify: true })).code)
  for (const state of ["consent", "success", "error", "expired"]) {
    const body = renderToStaticMarkup(createElement(OAuthDocument, { state, title: "{{TITLE}}", message: "{{MESSAGE}}", actionUrl: state === "consent" ? "https://aurora.invalid/{{ACTION}}" : undefined }))
      .replace("https://aurora.invalid/{{ACTION}}", "{{ACTION}}")
    await writeFile(join(destination, `${state}.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>{{TITLE}}</title><style>{{STYLE}}</style></head><body>${body}</body></html>\n`)
  }
  const provenance = Object.fromEntries(await Promise.all(sources.map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])))
  await writeFile(join(destination, "provenance.json"), JSON.stringify({ source: "https://github.com/dinglebear-ai/aurora", generator: "scripts/build-oauth-document.mjs", files: provenance }, null, 2) + "\n")
} finally { await rm(temporary, { recursive: true, force: true }) }
