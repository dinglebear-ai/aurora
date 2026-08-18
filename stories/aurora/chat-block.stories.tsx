import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { AuroraChatBlock } from "@/registry/aurora/blocks/ai/chat/chat"

const meta = {
  title: "Aurora Blocks/AI/Interactive Chat",
  component: AuroraChatBlock,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--aurora-page-bg)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuroraChatBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const InteractiveFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox", { name: "Message" })

    await expect(canvas.getByText("steering.ts")).toBeInTheDocument()
    await expect(canvas.getByText("Sources & references")).toBeInTheDocument()
    await expect(canvas.getByRole("combobox", { name: "Model" })).toBeInTheDocument()
    await expect(canvas.getByRole("combobox", { name: "Reasoning" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: /Reasoned for 2s/i })).toBeInTheDocument()

    await userEvent.type(input, "/rev")
    const skills = canvas.getByRole("listbox", { name: "Skills and slash commands" })
    await userEvent.click(within(skills).getByRole("option", { name: /review/i }))
    await expect(input).toHaveValue("/review ")
    await userEvent.clear(input)

    await userEvent.type(input, "@chat")
    const files = canvas.getByRole("listbox", { name: "File mentions" })
    await userEvent.click(within(files).getByRole("option", { name: /chat\.tsx/i }))
    await expect(input).toHaveValue("@chat.tsx ")
    await userEvent.clear(input)

    await userEvent.click(canvas.getByRole("button", { name: "Add mock attachment" }))
    await expect(canvas.getByText("gateway-health.json")).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Remove gateway-health.json" }))

    await userEvent.type(input, "Show the streaming behavior.")
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }))
    await expect(canvas.getByText("Show the streaming behavior.")).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "Stop response" })).toBeInTheDocument()

    await userEvent.type(input, "Keep it concise.")
    await userEvent.click(canvas.getByRole("button", { name: "Send steering message" }))
    await expect(canvas.getByText("Keep it concise.")).toBeInTheDocument()

    await waitFor(
      () => expect(canvas.getByText(/Steering applied\./)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  },
}

export const StopFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox", { name: "Message" })
    await userEvent.type(input, "Start a response I can stop.")
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }))
    const stop = canvas.getByRole("button", { name: "Stop response" })
    await userEvent.click(stop)
    await expect(canvas.queryByText("Aurora is reasoning")).not.toBeInTheDocument()
    await expect(input).not.toBeDisabled()
  },
}

export const AttachmentLifecycle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add mock attachment" }))
    const attachment = canvasElement.querySelector<HTMLElement>('.aurora-chat-attachment[data-state="uploading"]')
    await expect(attachment).toBeInTheDocument()
    await expect(attachment).toHaveAttribute("data-state", "uploading")
    await waitFor(() => expect(attachment).toHaveAttribute("data-state", "processing"), { timeout: 1200 })
    await waitFor(() => expect(attachment).toHaveAttribute("data-state", "done"), { timeout: 2200 })
    await expect(attachment?.querySelector(".aurora-chat-attachment__state-badge")).toBeInTheDocument()
  },
}
