// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  ignores: [
    ".worktrees/**",
    ".claude/**",
    ".next/**",
    "out/**",
    "storybook-static/**",
    "public/catalog/**",
    "public/r/**",
    "public/dinglebear/**",
    "android/**/build/**",
    // Vite build output for the apps/* workspaces. Git-ignored, but eslint has
    // its own ignore list, so after a local `pnpm catalog:device:build` these
    // minified bundles were linted and reported 77 errors that do not exist in
    // CI (which lints without a prebuilt dist).
    "apps/*/dist/**",
    "apps/*/src-tauri/target/**",
    "apps/*/src-tauri/gen/**/build/**",
    "apps/*/src-tauri/gen/**/.gradle/**",
    "themes/**",
    "dinglebear/**",
  ],
}, {
  rules: {
    "@next/next/no-img-element": "off",
    // Allow intentionally-discarded vars/args prefixed with `_`
    // (e.g. destructure-to-omit non-DOM props before spreading `...rest`).
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
    ],
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
