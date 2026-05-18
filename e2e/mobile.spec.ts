/**
 * Mobile-only tests — sidebar is CSS-hidden; content lives in a bottom Sheet.
 * Only runs on the "mobile" project (Pixel 5 viewport via Chromium).
 *
 * The SheetContent has data-testid="mobile-panel" so we can scope assertions
 * to it without strict-mode collisions from the hidden desktop sidebar.
 */
import { test, expect } from "@playwright/test";

/** Opens the mobile bottom sheet and returns a scoped locator for its content. */
async function openSheet(page: import("@playwright/test").Page) {
  await page.goto("/");
  // Click via data-slot attribute — more reliable than text match
  const trigger = page.locator('[data-slot="sheet-trigger"]');
  await expect(trigger).toBeVisible({ timeout: 8000 });
  await trigger.click();
  // Wait for panel content (data-testid is on SheetContent → Dialog.Popup)
  const panel = page.locator('[data-testid="mobile-panel"]');
  await expect(panel).toBeVisible({ timeout: 8000 });
  return panel;
}

test("mobile bottom bar shows trip name and booking count", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Italy 2026")).toBeVisible();
  await expect(page.getByText(/booked/)).toBeVisible();
});

test("mobile tapping bottom bar opens itinerary sheet", async ({ page }) => {
  const panel = await openSheet(page);
  await expect(panel.getByText("NYC → Milan")).toBeVisible();
  await expect(panel.getByText("Lake Maggiore")).toBeVisible();
});

test("mobile itinerary sheet shows booking progress", async ({ page }) => {
  const panel = await openSheet(page);
  await expect(panel.getByText(/confirmed/)).toBeVisible();
});

test("mobile itinerary sheet has theme buttons", async ({ page }) => {
  const panel = await openSheet(page);
  await expect(panel.getByRole("button", { name: "Amalfi" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Capri" })).toBeVisible();
});

test("mobile timeline row expands inside sheet", async ({ page }) => {
  const panel = await openSheet(page);
  await panel.getByRole("button").filter({ hasText: "CAG → Paris → NYC" }).click();
  await page.waitForTimeout(400);
  await expect(panel.getByText("XDQETZ").first()).toBeVisible();
});
