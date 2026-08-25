const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    job: {
      count: mocks.count,
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
    },
  },
}));

import { getJobDetail, listJobs } from "./queries";

const application = {
  id: "application-id",
  currentStatus: "NOT_APPLIED" as const,
  statusUpdatedAt: new Date("2026-08-25T01:00:00.000Z"),
};

const listRecord = {
  id: "job-id",
  jobName: "案件",
  companyName: "企業",
  workStyle: "HYBRID" as const,
  prefecture: "東京都",
  city: null,
  nearestStation: null,
  monthlyRateMinYen: 600_000,
  monthlyRateMaxYen: 800_000,
  agentCompany: { id: "company-id", companyName: "紹介元" },
  application,
};

describe("job queries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("lists active jobs using stable newest-first ordering", async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findMany.mockResolvedValue([listRecord]);

    const result = await listJobs({ page: 2, pageSize: 10 });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toMatchObject({
      items: [
        {
          id: "job-id",
          application: {
            id: "application-id",
            status: "NOT_APPLIED",
            statusUpdatedAt: "2026-08-25T01:00:00.000Z",
          },
        },
      ],
      pageInfo: { page: 2, pageSize: 10, totalCount: 1, totalPages: 1 },
    });
  });

  it("returns null for a missing or deleted detail and maps all detail values", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    await expect(getJobDetail("missing")).resolves.toBeNull();

    mocks.findFirst.mockResolvedValueOnce({
      ...listRecord,
      commercialFlow: "一次請け",
      workStyleNotes: "週2出社",
      locationNotes: null,
      utilizationPercent: "80.5",
      technologies: ["TypeScript"],
      processPhases: ["実装"],
      requiredConditions: "実務経験",
      preferredConditions: null,
    });

    await expect(getJobDetail("job-id")).resolves.toMatchObject({
      id: "job-id",
      utilizationPercent: 80.5,
      technologies: ["TypeScript"],
      application: { status: "NOT_APPLIED" },
    });
    expect(mocks.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: "job-id", deletedAt: null } }),
    );
  });

  it("fails instead of returning a job without its required Application", async () => {
    mocks.count.mockResolvedValue(1);
    mocks.findMany.mockResolvedValue([{ ...listRecord, application: null }]);

    await expect(listJobs({ page: 1, pageSize: 20 })).rejects.toThrow(
      "has no Application",
    );
  });
});
