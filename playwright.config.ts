import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,       // single worker prevents two projects thrashing the dev server
  retries: 1,       // one retry for transient timing flakes
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3456",
    trace: "on-first-retry",
  },

  webServer: {
    command: "npm run dev -- --port 3456",
    url: "http://localhost:3456",
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      // Run shared + desktop specs on desktop Chrome
      testMatch: ["**/app.spec.ts", "**/desktop.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      // Run shared + mobile specs on a Pixel 5 (Chromium, no extra install)
      testMatch: ["**/app.spec.ts", "**/mobile.spec.ts"],
      use: { ...devices["Pixel 5"], browserName: "chromium" },
    },
  ],
});
