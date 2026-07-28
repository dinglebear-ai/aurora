import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from "react"
import { Copy, ExternalLink, FileCode2 } from "lucide-react"

import type { FixtureId } from "@/catalog/fixtures"
import type { RegistryCatalogItem } from "@/catalog/types"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/aurora/ui/card"
import { Skeleton } from "@/registry/aurora/ui/skeleton"

type DemoModule = { default: ComponentType }
type DemoLoader = () => Promise<DemoModule>

const galleryModules = import.meta.glob<DemoModule>([
  "../../../app/gallery/demos/*.tsx",
  "!../../../app/gallery/demos/parity-demo.tsx",
  "!../../../app/gallery/demos/alert-demo.tsx",
  "!../../../app/gallery/demos/status-indicator-demo.tsx",
])

const demoComponents = Object.fromEntries(
  Object.entries(galleryModules).map(([path, loader]) => {
    const moduleName = path.split("/").at(-1)?.replace(/\.tsx$/, "") ?? path
    return [moduleName, lazy(loader as DemoLoader)] as const
  }),
) as Readonly<Record<string, ReturnType<typeof lazy>>>

const fixtureComponents: Readonly<Record<FixtureId, ReturnType<typeof lazy>>> = {
  button: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.ButtonFixture }))),
  card: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.CardFixture }))),
  feedback: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.FeedbackFixture }))),
  forms: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.FormsFixture }))),
  progress: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.ProgressFixture }))),
  disclosure: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.DisclosureFixture }))),
  overlays: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.OverlaysFixture }))),
  widgets: lazy(() => import("@/catalog/fixtures").then((fixtureModule) => ({ default: fixtureModule.WidgetsFixture }))),
}

export function RegistryPreview({ item }: { item: RegistryCatalogItem }) {
  if (item.fixtureId) {
    const Fixture = fixtureComponents[item.fixtureId as FixtureId]
    return <Suspense fallback={<PreviewSkeleton />}><Fixture /></Suspense>
  }

  if (item.demoModule) {
    const Demo = demoComponents[item.demoModule]
    if (Demo) {
      return (
        <PreviewErrorBoundary key={item.id} fallback={<MetadataPreview item={item} error />}>
          <Suspense fallback={<PreviewSkeleton />}><div className="catalog-demo-surface"><Demo /></div></Suspense>
        </PreviewErrorBoundary>
      )
    }
  }

  return <MetadataPreview item={item} />
}

function PreviewSkeleton() {
  return <div className="flex w-full flex-col gap-4"><Skeleton variant="title" width="w-1/3" /><Skeleton variant="text" /><Skeleton variant="text" width="w-2/3" /><Skeleton variant="card" /></div>
}

function MetadataPreview({ item, error = false }: { item: RegistryCatalogItem; error?: boolean }) {
  const installCommand = `pnpm dlx shadcn@latest add @aurora/${item.id}`
  const copyInstall = async () => {
    await navigator.clipboard?.writeText(installCommand)
  }

  return (
    <Card className="w-full max-w-[760px]" accent={error ? "rose" : "cyan"}>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{error ? "Preview unavailable" : item.title}</CardTitle><CardDescription>{error ? "The registry metadata is still available while this demo is repaired." : "Registry metadata and cross-platform contract."}</CardDescription></div><Badge tone={error ? "error" : "info"}>{item.registryType.replace("registry:", "")}</Badge></div></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2"><Metadata label="Registry name" value={item.id} /><Metadata label="Mobile readiness" value={item.mobileReadiness} /><Metadata label="Source" value={item.sourcePath ?? "Generated registry item"} /><Metadata label="Preview" value={item.demoModule ?? "Metadata only"} /></div>
        <p className="m-0 text-sm text-[var(--aurora-text-muted)]">{item.mobileReadinessReason}</p>
        <div className="flex flex-wrap gap-2">{item.capabilities.map((capability) => <Badge key={capability} tone="neutral" fill="outline">{capability}</Badge>)}</div>
        <div className="catalog-install-command"><FileCode2 aria-hidden /><code>{installCommand}</code><Button size="icon" variant="ghost" aria-label="Copy install command" onClick={() => void copyInstall()}><Copy aria-hidden /></Button></div>
        <Button asChild variant="neutral" iconRight={<ExternalLink aria-hidden />}><a href={item.installUrl} target="_blank" rel="noreferrer">Open registry JSON</a></Button>
      </CardContent>
    </Card>
  )
}

function Metadata({ label, value }: { label: string; value: string }) {
  return <div className="catalog-metadata"><span>{label}</span><strong>{value}</strong></div>
}

class PreviewErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Aurora catalog preview failed", error, info) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
