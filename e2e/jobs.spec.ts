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

test("shows the job list and complete detail with current status", async ({
  page,
}) => {
  await login(page);

  await expect(page.getByRole("heading", { name: "案件一覧" })).toBeVisible();
  await expect(
    page.getByRole("cell", {
      name: "サンプルWebアプリ開発案件",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "未応募", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "ハイブリッド", exact: true }),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);

  await page
    .getByRole("link", { name: "サンプルWebアプリ開発案件の詳細" })
    .click();

  await expect(page.getByRole("heading", { name: "案件詳細" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "基本情報" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "勤務条件" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "業務・スキル" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "応募状況" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /サンプルエージェント株式会社/u }),
  ).toBeVisible();
  await expect(page.getByText("TypeScript、Next.js、PostgreSQL")).toBeVisible();
  await expect(page.getByText("未応募", { exact: true })).toBeVisible();
  await expectNoHorizontalClipping(page);
});

test("uses readable cards and detail sections on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  await expect(
    page.getByRole("link", { name: "サンプルWebアプリ開発案件の詳細" }),
  ).toBeVisible();
  await expect(
    page.getByText("登録はデスクトップで利用できます"),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);

  await page
    .getByRole("link", { name: "サンプルWebアプリ開発案件の詳細" })
    .click();
  await expect(
    page.getByText("登録・編集・削除はデスクトップで利用できます"),
  ).toBeVisible();
  await expectNoHorizontalClipping(page);
});

test("keeps stable pagination order and excludes logically deleted jobs", async ({
  page,
}) => {
  const company = await prisma.agentCompany.findFirstOrThrow({
    where: { companyName: "サンプルエージェント株式会社", deletedAt: null },
  });
  const jobIds = [
    "00000000-0000-4000-8000-000000000001",
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003",
    "00000000-0000-4000-8000-000000000004",
  ];
  const createdAt = new Date();

  await prisma.application.deleteMany({ where: { jobId: { in: jobIds } } });
  await prisma.job.deleteMany({ where: { id: { in: jobIds } } });

  try {
    await prisma.job.createMany({
      data: jobIds.map((id, index) => ({
        id,
        agentCompanyId: company.id,
        jobName: `E2E順序案件-${index + 1}`,
        workStyle: "UNKNOWN",
        createdAt,
        deletedAt: index === 3 ? createdAt : null,
      })),
    });
    await prisma.application.createMany({
      data: jobIds.map((jobId, index) => ({
        id: `00000000-0000-4000-8000-00000000010${index + 1}`,
        jobId,
      })),
    });

    await login(page);
    const firstResponse = await page.request.get("/api/jobs?page=1&pageSize=2");
    expect(firstResponse.ok()).toBe(true);
    const firstPage = (await firstResponse.json()) as {
      items: Array<{ id: string }>;
    };
    expect(firstPage.items.map((item) => item.id)).toEqual([
      jobIds[2],
      jobIds[1],
    ]);
    expect(firstPage.items.map((item) => item.id)).not.toContain(jobIds[3]);

    await page.goto("/jobs?page=1&pageSize=2");
    await expect(
      page.getByRole("cell", { name: "E2E順序案件-3", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "E2E順序案件-2", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "次のページ" }).click();
    await expect(
      page.getByRole("cell", { name: "E2E順序案件-1", exact: true }),
    ).toBeVisible();

    await page.goto(`/jobs/${jobIds[3]}`);
    await expect(
      page.getByRole("heading", { name: "案件が見つかりません" }),
    ).toBeVisible();
  } finally {
    await prisma.application.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  }
});
