export type MobileReadiness = "ready" | "adaptive" | "native-bridge" | "desktop-first" | "metadata-only"

export interface RegistryCatalogItem {
  id: string
  title: string
  description: string
  registryType: string
  group: string
  categories: string[]
  sourcePath: string | null
  installTarget: string | null
  installUrl: string
  files: string[]
  dependencies: string[]
  registryDependencies: string[]
  fixtureId: string | null
  previewSlug: string | null
  demoModule: string | null
  mobileReadiness: MobileReadiness
  mobileReadinessReason: string
  capabilities: string[]
}

export interface CatalogInventory {
  schemaVersion: number
  counts: {
    registryItems: number
    galleryPreviews: number
    sharedFixtures: number
    metadataOnly: number
  }
  groups: string[]
  items: RegistryCatalogItem[]
}

export type CatalogMode = "registry" | "capabilities"
