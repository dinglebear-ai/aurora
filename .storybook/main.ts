import type { StorybookConfig } from "@storybook/nextjs-vite"

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  core: {
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "devhost",
      "devhost.example.ts.net",
      "198.51.100.1",
    ],
  },
}

export default config
