import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { MoreHorizontal } from "lucide-react"

import { Accordion, AccordionItem } from "@/registry/aurora/ui/accordion"
import { Button } from "@/registry/aurora/ui/button"
import { Collapsible } from "@/registry/aurora/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/registry/aurora/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/aurora/ui/tooltip"

const meta = {
  title: "Aurora UI/Disclosure and Menus",
  parameters: {
    docs: {
      description: {
        component: "Keyboard-sensitive disclosure, menu, and tooltip primitives.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AccordionStates: Story = {
  render: () => (
    <div className="w-[560px]">
      <Accordion type="single" defaultValue="install">
        <AccordionItem value="install" title="Install Aurora" meta="Recommended">
          Add the registry URL to components.json, then install any primitive with the shadcn CLI.
        </AccordionItem>
        <AccordionItem value="tokens" title="Load design tokens">
          Import the Aurora token layer before component styles so every surface resolves correctly.
        </AccordionItem>
        <AccordionItem value="verify" title="Verify accessibility">
          Run the Storybook accessibility panel and keyboard interaction checks before publishing.
        </AccordionItem>
      </Accordion>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "Load design tokens" })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(canvas.getByText(/Import the Aurora token layer/)).toBeVisible()
  },
}

export const CollapsibleDetails: Story = {
  render: () => (
    <div className="w-[520px]">
      <Collapsible title="Generated registry artifacts" defaultOpen>
        <ul className="grid gap-2">
          <li>registry.json</li>
          <li>public/r/aurora-button.json</li>
          <li>lib/client-catalog.json</li>
        </ul>
      </Collapsible>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "Generated registry artifacts" })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(canvas.getByText("registry.json")).toBeVisible()
  },
}

export const ActionMenu: Story = {
  render: () => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Component actions"><MoreHorizontal className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Component actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Open preview<DropdownMenuShortcut>Enter</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem>Copy install command<DropdownMenuShortcut>⌘C</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[var(--aurora-error)]">Remove draft</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Component actions" }))
    await expect(body.getByRole("menuitem", { name: /Open preview/ })).toBeVisible()
  },
}

export const AccessibleTooltip: Story = {
  render: () => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild><Button variant="neutral">Hover or focus</Button></TooltipTrigger>
        <TooltipContent>Registry checks passed</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Hover or focus" })
    await userEvent.hover(trigger)
    await waitFor(() => expect(body.getByRole("tooltip")).toBeVisible())
  },
}
