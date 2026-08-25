const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  AgentCompanyUnavailableError,
  createJobWithApplication,
  JobUnavailableError,
  updateJob,
} from "./mutations";
import type { CreateJobInput } from "./input";

const input: CreateJobInput = {
  jobName: "案件",
  agentCompanyId: "123e4567-e89b-42d3-a456-426614174000",
  companyName: null,
  commercialFlow: null,
  monthlyRateMinYen: null,
  monthlyRateMaxYen: null,
  workStyle: "UNKNOWN",
  workStyleNotes: null,
  prefecture: null,
  city: null,
  nearestStation: null,
  locationNotes: null,
  utilizationPercent: null,
  technologies: [],
  processPhases: [],
  requiredConditions: null,
  preferredConditions: null,
};

describe("createJobWithApplication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      (operation: (transaction: unknown) => unknown) =>
        operation({
          $queryRaw: mocks.queryRaw,
          job: { create: mocks.create, update: mocks.update },
        }),
    );
  });

  it("locks the active company and creates one NOT_APPLIED Application", async () => {
    mocks.queryRaw.mockResolvedValue([
      { id: input.agentCompanyId, deleted_at: null },
    ]);
    mocks.create.mockResolvedValue({
      id: "job-id",
      jobName: "案件",
      companyName: null,
      commercialFlow: null,
      monthlyRateMinYen: null,
      monthlyRateMaxYen: null,
      workStyle: "UNKNOWN",
      workStyleNotes: null,
      prefecture: null,
      city: null,
      nearestStation: null,
      locationNotes: null,
      utilizationPercent: null,
      technologies: [],
      processPhases: [],
      requiredConditions: null,
      preferredConditions: null,
      agentCompany: { id: input.agentCompanyId, companyName: "紹介元" },
      application: {
        id: "application-id",
        currentStatus: "NOT_APPLIED",
        statusUpdatedAt: new Date("2026-08-25T01:00:00.000Z"),
      },
    });

    await expect(createJobWithApplication(input)).resolves.toMatchObject({
      id: "job-id",
      application: { id: "application-id", status: "NOT_APPLIED" },
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.queryRaw).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobName: "案件",
          application: { create: { currentStatus: "NOT_APPLIED" } },
        }),
      }),
    );
  });

  it("does not create either record for a deleted company", async () => {
    mocks.queryRaw.mockResolvedValue([
      { id: input.agentCompanyId, deleted_at: new Date() },
    ]);

    await expect(createJobWithApplication(input)).rejects.toBeInstanceOf(
      AgentCompanyUnavailableError,
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("propagates nested Application creation failure to the transaction", async () => {
    mocks.queryRaw.mockResolvedValue([
      { id: input.agentCompanyId, deleted_at: null },
    ]);
    mocks.create.mockRejectedValue(new Error("application create failed"));

    await expect(createJobWithApplication(input)).rejects.toThrow(
      "application create failed",
    );
  });
});

describe("updateJob", () => {
  const jobId = "123e4567-e89b-42d3-a456-426614174001";
  const application = {
    id: "application-id",
    currentStatus: "INTERVIEWING",
    statusUpdatedAt: new Date("2026-08-25T02:00:00.000Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      (operation: (transaction: unknown) => unknown) =>
        operation({
          $queryRaw: mocks.queryRaw,
          job: { create: mocks.create, update: mocks.update },
        }),
    );
  });

  it("locks the job and company and updates only Job fields", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([{ id: input.agentCompanyId, deleted_at: null }]);
    mocks.update.mockResolvedValue({
      id: jobId,
      ...input,
      agentCompany: { id: input.agentCompanyId, companyName: "紹介元" },
      application,
    });

    await expect(updateJob(jobId, input)).resolves.toMatchObject({
      id: jobId,
      application: { id: "application-id", status: "INTERVIEWING" },
    });
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: jobId },
        data: expect.not.objectContaining({ application: expect.anything() }),
      }),
    );
  });

  it("does not update a missing or deleted job", async () => {
    mocks.queryRaw.mockResolvedValueOnce([]);

    await expect(updateJob(jobId, input)).rejects.toBeInstanceOf(
      JobUnavailableError,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not update when the selected company is unavailable", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([
        { id: input.agentCompanyId, deleted_at: new Date() },
      ]);

    await expect(updateJob(jobId, input)).rejects.toBeInstanceOf(
      AgentCompanyUnavailableError,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
