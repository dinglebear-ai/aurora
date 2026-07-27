import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Download, Save, Settings } from "lucide-react"

import { Button } from "@/registry/aurora/ui/button"

const meta = {
  title: "Aurora UI/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "Aurora's token-backed shadcn button with variant, size, loading, icon, and disabled states.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["aurora", "neutral", "rose", "success", "warn", "ghost", "destructive", "plain"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg", "icon", "unstyled"],
    },
  },
  args: {
    children: "Deploy Aurora",
    variant: "aurora",
    size: "default",
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="aurora">Aurora</Button>
      <Button variant="neutral">Neutral</Button>
      <Button variant="rose">Rose</Button>
      <Button variant="success">Success</Button>
      <Button variant="warn">Warn</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
}

export const SizesAndIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm"><Save className="size-3.5" />Save</Button>
      <Button><Download className="size-4" />Export</Button>
      <Button size="lg" variant="aurora"><Settings className="size-4" />Configure</Button>
      <Button size="icon" aria-label="Settings"><Settings className="size-4" /></Button>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
      <Button variant="rose" loading>Publishing</Button>
      <Button variant="ghost" disabled>Ghost disabled</Button>
    </div>
  ),
}
