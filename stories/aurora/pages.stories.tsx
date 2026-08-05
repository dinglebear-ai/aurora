import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  ChatPageFixture,
  FilesPageFixture,
  GatewayPageFixture,
  LogViewerPageFixture,
  PalettePageFixture,
} from "@/catalog/fixtures"

const meta = {
  title: "Aurora Pages/Responsive Starters",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Repo-native previews for Aurora registry page starters, shared with the browser and Tauri device catalog.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Gateway: Story = { render: () => <GatewayPageFixture /> }
export const Chat: Story = { render: () => <ChatPageFixture /> }
export const LogViewer: Story = { render: () => <LogViewerPageFixture /> }
export const Palette: Story = { render: () => <PalettePageFixture /> }
export const Files: Story = { render: () => <FilesPageFixture /> }
