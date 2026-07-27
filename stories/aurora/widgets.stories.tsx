import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { WidgetsFixture } from "@/catalog/fixtures"

import { Combobox } from "@/registry/aurora/ui/combobox"
import { MultiSelect } from "@/registry/aurora/ui/multi-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/aurora/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/registry/aurora/ui/radio-group"

const meta = { title: "Aurora/Interaction Contracts", parameters: { layout: "centered" } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const DeviceCatalogFixture: Story = { render: () => <WidgetsFixture /> }

export const ComboboxKeyboard: Story = {
  render: () => <div className="w-80"><Combobox options={[{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }]} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button")
    await userEvent.click(trigger)
    const input = canvas.getByRole("combobox")
    await expect(input).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(trigger).toHaveTextContent("Beta")
    await expect(trigger).toHaveFocus()
  },
}

export const RadioGroupKeyboard: Story = {
  render: () => <RadioGroup defaultValue="alpha" aria-label="Agent"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">Beta</RadioGroupItem></RadioGroup>,
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio")
    radios[0].focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(radios[1]).toHaveFocus()
    await expect(radios[1]).toBeChecked()
    await expect(radios[0]).not.toBeChecked()
  },
}

export const MultiSelectKeyboard: Story = {
  render: () => (
    <div className="w-80">
      <MultiSelect
        aria-label="Environments"
        options={[
          { value: "alpha", label: "Alpha" },
          { value: "beta", label: "Beta" },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole("combobox", { name: "Environments" })
    combobox.focus()
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}")
    await expect(canvas.getByRole("option", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await expect(combobox).toHaveAttribute("aria-activedescendant", expect.stringContaining("option-1"))
  },
}

export const PopoverFocusAndEscape: Story = {
  render: () => <Popover><PopoverTrigger>Open</PopoverTrigger><PopoverContent><button type="button">First Action</button></PopoverContent></Popover>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const documentBody = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Open" })
    await userEvent.click(trigger)
    await expect(documentBody.getByRole("button", { name: "First Action" })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect(trigger).toHaveAttribute("data-state", "closed")
    await waitFor(() => expect(trigger).toHaveFocus())
    trigger.dataset.interactionComplete = "true"
  },
}
