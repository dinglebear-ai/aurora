import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ProgressFixture } from "@/catalog/fixtures"

import { Badge } from "@/registry/aurora/ui/badge"
import { DescriptionItem, DescriptionList } from "@/registry/aurora/ui/description-list"
import { Stepper } from "@/registry/aurora/ui/stepper"
import { Timeline, TimelineItem } from "@/registry/aurora/ui/timeline"

const meta = {
  title: "Aurora UI/Progress and Metadata",
  parameters: {
    docs: {
      description: {
        component: "Structured metadata, lifecycle history, and multi-step progress surfaces.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DeviceCatalogFixture: Story = { render: () => <ProgressFixture /> }

export const RegistryMetadata: Story = {
  render: () => (
    <DescriptionList className="w-[640px]">
      <DescriptionItem label="Registry item" value="aurora-prompt-input" active />
      <DescriptionItem label="Type" value={<Badge tone="info">Block</Badge>} />
      <DescriptionItem label="Dependencies" value="Button, Textarea, Tooltip, Popover" />
      <DescriptionItem label="Status" value={<Badge tone="success" dot>Published</Badge>} />
    </DescriptionList>
  ),
}

export const ReleaseTimeline: Story = {
  render: () => (
    <Timeline className="w-[560px]">
      <TimelineItem tone="online" title="Registry generated" meta="10:42 AM">All public JSON artifacts match registry.json.</TimelineItem>
      <TimelineItem tone="automating" title="Visual checks running" meta="10:44 AM">Storybook is rendering interaction-heavy primitives.</TimelineItem>
      <TimelineItem tone="queued" title="Production promotion" meta="Queued">The immutable image will publish after required checks pass.</TimelineItem>
    </Timeline>
  ),
}

export const PublishingStepper: Story = {
  render: () => (
    <div className="w-[760px]">
      <Stepper
        current={2}
        steps={[
          { label: "Compose", description: "Build the component" },
          { label: "Validate", description: "Run contracts" },
          { label: "Preview", description: "Review Storybook" },
          { label: "Publish", description: "Promote artifacts" },
        ]}
      />
    </div>
  ),
}
