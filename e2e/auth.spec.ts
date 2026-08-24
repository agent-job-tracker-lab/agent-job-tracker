import { expect, test } from "@playwright/test";

test("redirects an unauthenticated user to the login screen", async ({
  page,
}) => {
  await page.goto("/jobs");

  await expect(page).toHaveURL(/\/login$/u);
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
});

test("shows the mobile login form without horizontal clipping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(page.getByLabel("メールアドレス")).toBeVisible();
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();

  const viewportWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBe(viewportWidth);
});
