const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  AgentCompanyUnavailableError,
  createJobWithApplication,
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
          job: { create: mocks.create },
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
