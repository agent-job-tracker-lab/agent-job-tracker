const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getJobDetail: vi.fn(),
  updateJob: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/jobs/queries", () => ({
  getJobDetail: mocks.getJobDetail,
}));

vi.mock("@/features/jobs/mutations", () => {
  class AgentCompanyUnavailableError extends Error {}
  class JobUnavailableError extends Error {}
  return {
    AgentCompanyUnavailableError,
    JobUnavailableError,
    updateJob: mocks.updateJob,
  };
});

import {
  AgentCompanyUnavailableError,
  JobUnavailableError,
} from "@/features/jobs/mutations";

import { GET, PATCH } from "./route";

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function detailRequest(jobId: string) {
  return GET(new Request(`http://localhost:3000/api/jobs/${jobId}`), {
    params: Promise.resolve({ jobId }),
  });
}

function updateRequest(
  jobId: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return PATCH(
    new Request(`http://localhost:3000/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ jobId }) },
  );
}

const validInput = {
  jobName: "更新案件",
  agentCompanyId: "123e4567-e89b-42d3-a456-426614174002",
  workStyle: "HYBRID",
};

describe("GET /api/jobs/{jobId}", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires authentication before validating the path", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await detailRequest("invalid");

    expect(response.status).toBe(401);
    expect(mocks.getJobDetail).not.toHaveBeenCalled();
  });

  it("rejects an invalid job id", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await detailRequest("invalid");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_PATH_PARAMETER",
      fieldErrors: [{ field: "path.jobId" }],
    });
  });

  it("does not expose a missing or logically deleted job", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.getJobDetail.mockResolvedValue(null);

    const response = await detailRequest(VALID_ID);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "JOB_NOT_FOUND" });
  });

  it("returns job, introducing company, and current status", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const job = {
      id: VALID_ID,
      jobName: "案件",
      agentCompany: { id: "company-id", companyName: "紹介元" },
      application: { id: "application-id", status: "APPLIED" },
    };
    mocks.getJobDetail.mockResolvedValue(job);

    const response = await detailRequest(VALID_ID);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(job);
    expect(mocks.getJobDetail).toHaveBeenCalledWith(VALID_ID);
  });
});

describe("PATCH /api/jobs/{jobId}", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("requires authentication", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await updateRequest(VALID_ID, validInput);

    expect(response.status).toBe(401);
    expect(mocks.updateJob).not.toHaveBeenCalled();
  });

  it("rejects an invalid path, origin, and body", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    expect((await updateRequest("invalid", validInput)).status).toBe(400);
    expect(
      (
        await updateRequest(VALID_ID, validInput, {
          origin: "https://example.test",
        })
      ).status,
    ).toBe(403);
    expect((await updateRequest(VALID_ID, {})).status).toBe(422);
    expect(mocks.updateJob).not.toHaveBeenCalled();
  });

  it("updates the Job and returns its unchanged Application summary", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const updated = {
      id: VALID_ID,
      ...validInput,
      application: { id: "application-id", status: "APPLIED" },
    };
    mocks.updateJob.mockResolvedValue(updated);

    const response = await updateRequest(VALID_ID, validInput);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updated);
    expect(mocks.updateJob).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining(validInput),
    );
  });

  it("returns not found for an unavailable Job or AgentCompany", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.updateJob.mockRejectedValueOnce(new JobUnavailableError());
    const missingJob = await updateRequest(VALID_ID, validInput);
    expect(missingJob.status).toBe(404);
    expect(await missingJob.json()).toMatchObject({ code: "JOB_NOT_FOUND" });

    mocks.updateJob.mockRejectedValueOnce(new AgentCompanyUnavailableError());
    const missingCompany = await updateRequest(VALID_ID, validInput);
    expect(missingCompany.status).toBe(404);
    expect(await missingCompany.json()).toMatchObject({
      code: "AGENT_COMPANY_NOT_FOUND",
    });
  });
});
