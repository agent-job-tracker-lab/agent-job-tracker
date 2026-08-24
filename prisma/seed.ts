import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, WorkStyle } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const existingCompany = await prisma.agentCompany.findFirst({
    where: {
      companyName: "サンプルエージェント株式会社",
      deletedAt: null,
    },
  });

  const company =
    existingCompany ??
    (await prisma.agentCompany.create({
      data: {
        companyName: "サンプルエージェント株式会社",
        contactName: "サンプル担当者",
        contactDetails: "sample@example.test",
        characteristics: "ローカル開発用のダミーデータ",
      },
    }));

  const existingJob = await prisma.job.findFirst({
    where: {
      agentCompanyId: company.id,
      jobName: "サンプルWebアプリ開発案件",
      deletedAt: null,
    },
  });

  if (!existingJob) {
    await prisma.$transaction(async (transaction) => {
      const job = await transaction.job.create({
        data: {
          agentCompanyId: company.id,
          jobName: "サンプルWebアプリ開発案件",
          workStyle: WorkStyle.HYBRID,
          technologies: ["TypeScript", "Next.js", "PostgreSQL"],
          processPhases: ["設計", "実装", "テスト"],
        },
      });

      await transaction.application.create({
        data: {
          jobId: job.id,
        },
      });
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Development seed failed.", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
