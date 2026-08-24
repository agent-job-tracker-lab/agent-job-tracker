import { expect, test } from "@playwright/test";

test("opens the development environment landing page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Agent Job Tracker" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Agent Job Tracker");
});
