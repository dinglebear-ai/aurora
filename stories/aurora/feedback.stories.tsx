import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CircleAlert, CircleCheck, Info, Sparkles } from "lucide-react"

import { FeedbackFixture } from "@/catalog/fixtures"

import { Badge } from "@/registry/aurora/ui/badge"
import { Callout } from "@/registry/aurora/ui/callout"
import { StatusIndicator } from "@/registry/aurora/ui/status-indicator"

const meta = {
  title: "Aurora UI/Feedback",
  parameters: {
    docs: {
      description: {
        component: "Status, badge, and callout primitives for operational UI feedback.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DeviceCatalogFixture: Story = { render: () => <FeedbackFixture /> }

export const Badges: Story = {
  render: () => (
    <div className="flex max-w-[640px] flex-wrap gap-3">
      <Badge tone="info" dot>Info</Badge>
      <Badge tone="success" dot pulse>Success</Badge>
      <Badge tone="warn" dot>Warn</Badge>
      <Badge tone="error" dot>Error</Badge>
      <Badge tone="rose" shape="pill">Rose tag</Badge>
      <Badge tone="violet" shape="pill">Automation</Badge>
    </div>
  ),
}

export const Statuses: Story = {
  render: () => (
    <div className="grid gap-3">
      <StatusIndicator tone="online" label="Registry online" />
      <StatusIndicator tone="syncing" label="Syncing tokens" />
      <StatusIndicator tone="automating" label="Agent building previews" />
      <StatusIndicator tone="degraded" label="Preview stale" />
      <StatusIndicator tone="offline" label="Worker offline" />
    </div>
  ),
}

export const Callouts: Story = {
  render: () => (
    <div className="grid w-[620px] gap-4">
      <Callout variant="info" title="Registry ready" icon={<Info className="size-4" />}>
        Install the component with the Aurora registry endpoint and keep token imports first.
      </Callout>
      <Callout variant="success" title="Build passed" icon={<CircleCheck className="size-4" />}>
        Component stories render with the production Aurora token layer.
      </Callout>
      <Callout variant="warn" title="Review contrast" icon={<CircleAlert className="size-4" />}>
        Use the accessibility panel before publishing newly composed blocks.
      </Callout>
      <Callout variant="info" title="Automation" icon={<Sparkles className="size-4" />}>
        Storybook now gives agents a stable surface for visual checks.
      </Callout>
    </div>
  ),
}
