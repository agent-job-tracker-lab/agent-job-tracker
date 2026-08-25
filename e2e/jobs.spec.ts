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

  await page
    .getByRole("link", { name: "編集する" })
    .count()
    .then((count) => expect(count).toBe(0));
  await page.goto(`${page.url()}/edit`);
  await expect(
    page.getByRole("heading", { name: "編集はデスクトップで利用できます" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "変更を保存" })).toHaveCount(0);
  await expectNoHorizontalClipping(page);

  await page.goto("/jobs/new");
  await expect(
    page.getByRole("heading", { name: "登録はデスクトップで利用できます" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "登録する" })).toHaveCount(0);
  await expectNoHorizontalClipping(page);
});

test("edits a Job without changing its Application or history", async ({
  page,
}) => {
  const suffix = Date.now();
  const originalCompany = await prisma.agentCompany.create({
    data: { companyName: `E2E編集元会社-${suffix}` },
  });
  const replacementCompany = await prisma.agentCompany.create({
    data: { companyName: `E2E編集先会社-${suffix}` },
  });
  const job = await prisma.job.create({
    data: {
      agentCompanyId: originalCompany.id,
      jobName: `E2E編集前案件-${suffix}`,
      companyName: "編集前企業",
      monthlyRateMinYen: 600_000,
      monthlyRateMaxYen: 800_000,
      workStyle: "HYBRID",
      technologies: ["TypeScript", "Next.js"],
      processPhases: ["設計", "実装"],
      application: {
        create: {
          currentStatus: "APPLIED",
        },
      },
    },
    include: { application: { include: { statusHistories: true } } },
  });
  const applicationBefore = job.application!;

  try {
    await login(page);
    await page.goto(`/jobs/${job.id}`);
    await page.getByRole("link", { name: "編集する" }).click();

    await expect(page.getByRole("heading", { name: "案件編集" })).toBeVisible();
    await expect(page.getByLabel(/^案件名/u)).toHaveValue(job.jobName);
    await expect(page.getByLabel("勤務形態必須")).toHaveValue("HYBRID");
    await expect(page.getByLabel("単価下限（万円）")).toHaveValue("60");
    await expect(page.getByLabel(/技術/u)).toHaveValue("TypeScript\nNext.js");
    await expectNoHorizontalClipping(page);

    await page.getByLabel(/^案件名/u).fill(`E2E編集後案件-${suffix}`);
    await page
      .getByLabel(/^紹介元エージェント会社/u)
      .selectOption(replacementCompany.id);
    await page.getByLabel("企業名").fill("");
    await page.getByLabel("単価下限（万円）").fill("65.25");
    await page.getByLabel("技術（1行に1件）").fill("TypeScript\nReact");
    await page.getByRole("button", { name: "変更を保存" }).click();

    await expect(page).toHaveURL(`/jobs/${job.id}`);
    await expect(page.getByText(`E2E編集後案件-${suffix}`)).toBeVisible();
    await expect(page.getByText(replacementCompany.companyName)).toBeVisible();
    await expect(page.getByText("65.25〜80万円")).toBeVisible();
    await expect(page.getByText("TypeScript、React")).toBeVisible();
    await expect(page.getByText("応募済み", { exact: true })).toBeVisible();

    const updated = await prisma.job.findUniqueOrThrow({
      where: { id: job.id },
      include: { application: { include: { statusHistories: true } } },
    });
    expect(updated.agentCompanyId).toBe(replacementCompany.id);
    expect(updated.companyName).toBeNull();
    expect(updated.monthlyRateMinYen).toBe(652_500);
    expect(updated.application).toMatchObject({
      id: applicationBefore.id,
      currentStatus: applicationBefore.currentStatus,
      statusUpdatedAt: applicationBefore.statusUpdatedAt,
      updatedAt: applicationBefore.updatedAt,
    });
    expect(updated.application?.statusHistories).toEqual(
      applicationBefore.statusHistories,
    );
  } finally {
    await prisma.application.delete({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.agentCompany.deleteMany({
      where: { id: { in: [originalCompany.id, replacementCompany.id] } },
    });
  }
});

test("creates a Job and one initial Application in the same operation", async ({
  page,
}) => {
  const jobName = `E2E登録案件-${Date.now()}`;

  try {
    await login(page);
    await page.getByRole("link", { name: "案件を登録" }).click();
    await expect(page.getByRole("heading", { name: "案件登録" })).toBeVisible();
    await expect(page.getByLabel("勤務形態必須")).toHaveValue("");
    await expectNoHorizontalClipping(page);

    await page.getByLabel(/^案件名/u).fill(jobName);
    await page
      .getByLabel(/^紹介元エージェント会社/u)
      .selectOption({ label: "サンプルエージェント株式会社" });
    await page.getByLabel("企業名").fill("E2E企業");
    await page.getByLabel("勤務形態必須").selectOption("HYBRID");
    await page.getByLabel("商流").fill("元請け\n一次請け");
    await page.getByLabel("単価下限（万円）").fill("60.25");
    await page.getByLabel("単価上限（万円）").fill("80");
    await page.getByLabel("勤務形態の補足").fill("週2日出社");
    await page.getByLabel("都道府県").selectOption("東京都");
    await page.getByLabel("市区町村").fill("新宿区");
    await page.getByLabel("最寄り駅").fill("新宿駅");
    await page.getByLabel("勤務地補足").fill("駅から徒歩5分");
    await page.getByLabel("稼働率（%）").fill("80.5");
    await page.getByLabel(/技術/u).fill("TypeScript\nNext.js");
    await page.getByLabel(/担当工程/u).fill("設計\n実装\nテスト");
    await page.getByLabel("必須条件").fill("TypeScript実務経験");
    await page.getByLabel("歓迎条件").fill("Next.js経験");
    await page.getByRole("button", { name: "登録する" }).click();

    await expect(page.getByRole("heading", { name: "案件詳細" })).toBeVisible();
    await expect(page.getByText(jobName)).toBeVisible();
    await expect(page.getByText("60.25〜80万円")).toBeVisible();
    await expect(page.getByText("東京都新宿区（新宿駅）")).toBeVisible();
    await expect(page.getByText("TypeScript、Next.js")).toBeVisible();
    await expect(page.getByText("未応募", { exact: true })).toBeVisible();
    await expectNoHorizontalClipping(page);

    const job = await prisma.job.findFirstOrThrow({
      where: { jobName },
      include: {
        application: { include: { statusHistories: true } },
      },
    });
    expect(job.monthlyRateMinYen).toBe(602_500);
    expect(job.utilizationPercent?.toString()).toBe("80.5");
    expect(job.application).toMatchObject({ currentStatus: "NOT_APPLIED" });
    expect(job.application?.statusHistories).toHaveLength(0);
  } finally {
    const jobs = await prisma.job.findMany({
      where: { jobName },
      select: { id: true },
    });
    const ids = jobs.map(({ id }) => id);
    await prisma.application.deleteMany({ where: { jobId: { in: ids } } });
    await prisma.job.deleteMany({ where: { id: { in: ids } } });
  }
});

test("does not create a Job when the introducing company is unavailable", async ({
  page,
}) => {
  const company = await prisma.agentCompany.create({
    data: {
      companyName: `E2E削除済み紹介元-${Date.now()}`,
      deletedAt: new Date(),
    },
  });
  const jobName = `E2E作成不可案件-${Date.now()}`;

  try {
    await login(page);
    const response = await page.request.post("/api/jobs", {
      headers: { origin: "http://localhost:3000" },
      data: {
        jobName,
        agentCompanyId: company.id,
        workStyle: "UNKNOWN",
      },
    });

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "AGENT_COMPANY_NOT_FOUND",
    });
    expect(await prisma.job.count({ where: { jobName } })).toBe(0);
    expect(
      await prisma.application.count({ where: { job: { jobName } } }),
    ).toBe(0);
  } finally {
    await prisma.agentCompany.delete({ where: { id: company.id } });
  }
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
