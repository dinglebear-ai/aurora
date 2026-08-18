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

    await userEvent.click(canvas.getByRole("button", { name: "Add mock attachment" }))
    await expect(canvas.getByText("gateway-health.json")).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Remove gateway-health.json" }))

    await userEvent.type(input, "Show the streaming behavior.")
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }))
    await expect(canvas.getByText("Show the streaming behavior.")).toBeInTheDocument()
    await expect(canvas.getByText("Aurora is composing a response")).toBeInTheDocument()

    await waitFor(
      () => expect(canvas.getByText(/Exactly\. This response is streaming/)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  },
}
