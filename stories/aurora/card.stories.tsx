import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/aurora/ui/card"
import { StatusIndicator } from "@/registry/aurora/ui/status-indicator"

const meta = {
  title: "Aurora UI/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: "Aurora panel surfaces with accent, elevation, and interactive treatments.",
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const ProductPanel: Story = {
  render: () => (
    <Card className="w-[420px]" accent="cyan" elevated>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Aurora registry</CardTitle>
            <CardDescription>Tokenized shadcn components ready for install.</CardDescription>
          </div>
          <Badge tone="info" dot>Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Items" value="176" />
          <Metric label="UI" value="79" />
          <Metric label="Blocks" value="73" />
        </div>
        <StatusIndicator tone="automating" label="Registry build queued" />
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost">View docs</Button>
        <Button>Install</Button>
      </CardFooter>
    </Card>
  ),
}

export const AccentGrid: Story = {
  render: () => (
    <div className="grid w-[680px] grid-cols-3 gap-4">
      <MiniCard accent="cyan" label="Cyan" />
      <MiniCard accent="rose" label="Rose" />
    </div>
  ),
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--aurora-border-default)] bg-[var(--aurora-control-surface)] p-3">
      <div className="aurora-text-label">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--aurora-text-primary)]">{value}</div>
    </div>
  )
}

function MiniCard({ accent, label }: { accent: "cyan" | "rose"; label: string }) {
  return (
    <Card accent={accent} interactive>
      <CardContent>
        <CardTitle>{label}</CardTitle>
        <CardDescription>Interactive accent surface.</CardDescription>
      </CardContent>
    </Card>
  )
}
