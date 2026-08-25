import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

import { prisma } from "../src/lib/db";

const email = process.env.BOOTSTRAP_USER_EMAIL;
const password = process.env.BOOTSTRAP_USER_PASSWORD;

test.skip(
  !email || !password,
  "BOOTSTRAP_USER_EMAIL and BOOTSTRAP_USER_PASSWORD are required",
);

test.afterAll(async () => prisma.$disconnect());

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

  await page.goto("/agent-companies/new");
  await expect(
    page.getByRole("heading", { name: "登録はデスクトップで利用できます" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "登録する" })).toHaveCount(0);
  await expectNoHorizontalClipping(page);
});

test("creates companies with the same name and keeps optional values", async ({
  page,
}) => {
  const companyName = `E2E登録会社-${Date.now()}`;

  try {
    await login(page);
    await page.goto("/agent-companies");
    await page.getByRole("link", { name: "エージェント会社を登録" }).click();

    await expect(
      page.getByRole("heading", { name: "エージェント会社登録" }),
    ).toBeVisible();
    const characteristicsSize = await page
      .getByLabel("特徴")
      .evaluate((element) => {
        const rectangle = element.getBoundingClientRect();
        return { width: rectangle.width, height: rectangle.height };
      });
    expect(characteristicsSize.width).toBeGreaterThan(900);
    expect(characteristicsSize.height).toBeGreaterThan(90);
    await expect(page.getByLabel(/関係状態/u)).toHaveValue("ACTIVE");
    await page.getByLabel(/会社名/u).fill(companyName);
    await page.getByLabel(/担当者名/u).fill("E2E担当者");
    await page.getByLabel("連絡先").fill("e2e@example.test\n000-0000-0000");
    await page.getByLabel("最終連絡日").fill("2026-08-25");
    await page.getByLabel("特徴").fill("E2Eで登録したダミーデータ");
    await page.getByRole("button", { name: "登録する" }).click();

    await expect(
      page.getByRole("heading", { name: "エージェント会社詳細" }),
    ).toBeVisible();
    await expect(page.getByText(companyName)).toBeVisible();
    await expect(page.getByText("E2E担当者")).toBeVisible();
    await expect(page.getByText(/e2e@example\.test/u)).toBeVisible();
    await expectNoHorizontalClipping(page);
    const firstCompanyUrl = page.url();

    await page.goto("/agent-companies/new");
    await page.getByLabel(/会社名/u).fill(companyName);
    await page.getByRole("button", { name: "登録する" }).click();
    await expect(
      page.getByRole("heading", { name: "エージェント会社詳細" }),
    ).toBeVisible();
    expect(page.url()).not.toBe(firstCompanyUrl);

    await expect
      .poll(() => prisma.agentCompany.count({ where: { companyName } }))
      .toBe(2);
  } finally {
    await prisma.agentCompany.deleteMany({ where: { companyName } });
  }
});
