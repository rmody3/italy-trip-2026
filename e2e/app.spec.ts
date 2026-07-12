/**
 * Shared smoke tests — run on both desktop and mobile projects.
 * Tests things visible in both layouts.
 */
import { test, expect } from "@playwright/test";

function collectErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));
  return errors;
}

test("page loads without JS errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await page.waitForTimeout(3000);
  const real = errors.filter(e =>
    !e.includes("Content Security Policy") &&
    !e.includes("favicon") &&
    !e.includes("ResizeObserver") &&
    !e.includes("maplibre")
  );
  expect(real, `Console errors:\n${real.join("\n")}`).toHaveLength(0);
});

test("page has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Italy/i);
});

test("trip title and dates are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Italy" }).first()).toBeVisible();
  await expect(page.getByText(/Jul 22 – Aug 6/).first()).toBeVisible();
});

test("timeline destinations are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("NYC → Milan")).toBeVisible();
  await expect(page.getByText("Lake Maggiore")).toBeVisible();
  await expect(page.getByText("Sardinia", { exact: true })).toBeVisible();
});

test("theme switcher buttons are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Amalfi" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Capri" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Notte" }).first()).toBeVisible();
});

test("expanding a timeline row shows leg details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "CAG → Paris → NYC" }).first().click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).toBeVisible();
});

test("confirmed booking count is shown", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/4\/\d+ confirmed/).first()).toBeVisible();
});
