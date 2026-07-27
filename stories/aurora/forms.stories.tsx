import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Search } from "lucide-react"
import type { ReactNode } from "react"

import { FormsFixture } from "@/catalog/fixtures"

import { Button } from "@/registry/aurora/ui/button"
import { Input } from "@/registry/aurora/ui/input"
import { Label } from "@/registry/aurora/ui/label"
import { PillGroup, PillTrigger, TabsContent } from "@/registry/aurora/ui/tabs"
import { Switch } from "@/registry/aurora/ui/switch"
import { Textarea } from "@/registry/aurora/ui/textarea"

const meta = {
  title: "Aurora UI/Form Controls",
  parameters: {
    docs: {
      description: {
        component: "Representative form controls using Aurora focus, validation, and control-surface tokens.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DeviceCatalogFixture: Story = { render: () => <FormsFixture /> }

export const Inputs: Story = {
  render: () => (
    <div className="grid w-[520px] gap-5">
      <Field label="Search registry">
        <Input startAdornment={<Search className="size-4" />} placeholder="button, dialog, workspace..." />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Input size="sm" placeholder="Small" />
        <Input placeholder="Default" />
        <Input size="lg" placeholder="Large" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input aria-label="Success state" state="success" defaultValue="Published" />
        <Input aria-label="Warning state" state="warn" defaultValue="Needs review" />
        <Input aria-label="Error state" state="error" defaultValue="Invalid token" />
      </div>
      <Field label="Release notes">
        <Textarea defaultValue="Adds Storybook coverage for the core Aurora primitives." />
      </Field>
    </div>
  ),
}

export const SettingsPanel: Story = {
  render: () => (
    <div className="w-[420px] space-y-6 rounded-[8px] border border-[var(--aurora-border-default)] bg-[var(--aurora-panel-medium)] p-5">
      <div>
        <h3 className="aurora-text-section">Preview settings</h3>
        <p className="aurora-text-body-sm mt-1 text-[var(--aurora-text-muted)]">Control common design-system states.</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="dark-preview">Dark preview</Label>
        <Switch id="dark-preview" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="a11y-checks">Accessibility checks</Label>
        <Switch id="a11y-checks" />
      </div>
      <PillGroup
        defaultValue="registry"
        panels={
          <>
            <TabsContent value="registry">Registry previews</TabsContent>
            <TabsContent value="site">Site previews</TabsContent>
            <TabsContent value="themes">Theme previews</TabsContent>
          </>
        }
      >
        <PillTrigger value="registry">Registry</PillTrigger>
        <PillTrigger value="site">Site</PillTrigger>
        <PillTrigger value="themes">Themes</PillTrigger>
      </PillGroup>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  ),
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="grid gap-2">
      <span>{label}</span>
      {children}
    </Label>
  )
}
