const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getJobDetail: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/jobs/queries", () => ({
  getJobDetail: mocks.getJobDetail,
}));

import { GET } from "./route";

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function detailRequest(jobId: string) {
  return GET(new Request(`http://localhost:3000/api/jobs/${jobId}`), {
    params: Promise.resolve({ jobId }),
  });
}

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
