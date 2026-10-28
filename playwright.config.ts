import { defineConfig } from "@playwright/test";

/**
 * Smoke test against an already running server (default http://localhost:5110).
 * Uses the system Google Chrome (`channel: "chrome"`), so no browser download.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5110",
    channel: "chrome",
    headless: true,
  },
});
