import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

const email = process.env.BOOTSTRAP_USER_EMAIL;
const password = process.env.BOOTSTRAP_USER_PASSWORD;

test.skip(
  !email || !password,
  "BOOTSTRAP_USER_EMAIL and BOOTSTRAP_USER_PASSWORD are required",
);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email!);
  await page.getByLabel("パスワード").fill(password!);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/jobs$/u);
}

async function expectNoHorizontalClipping(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBe(dimensions.viewport);
}

test("shows the agent company list and detail with related jobs", async ({
  page,
}) => {
  await login(page);
  await page.goto("/agent-companies");

  await expect(
    page.getByRole("heading", { name: "エージェント会社一覧" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", {
      name: "サンプルエージェント株式会社",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "サンプル担当者" }),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);

  await page
    .getByRole("link", {
      name: /サンプルエージェント株式会社の詳細/u,
    })
    .click();

  await expect(
    page.getByRole("heading", { name: "エージェント会社詳細" }),
  ).toBeVisible();
  await expect(page.getByText("sample@example.test")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /サンプルWebアプリ開発案件/u }),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);
});

test("uses cards and keeps read-only actions visible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/agent-companies");

  await expect(
    page.getByRole("link", {
      name: "サンプルエージェント株式会社の詳細",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("登録はデスクトップで利用できます"),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);

  await page
    .getByRole("link", {
      name: /サンプルエージェント株式会社の詳細/u,
    })
    .click();
  await expect(
    page.getByText("編集・削除はデスクトップで利用できます"),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);
});
