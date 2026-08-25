const mocks = vi.hoisted(() => {
  class AgentCompanyUnavailableError extends Error {}
  return {
    AgentCompanyUnavailableError,
    createJobWithApplication: vi.fn(),
    getSession: vi.fn(),
    listJobs: vi.fn(),
  };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/jobs/queries", () => ({ listJobs: mocks.listJobs }));

vi.mock("@/features/jobs/mutations", () => ({
  AgentCompanyUnavailableError: mocks.AgentCompanyUnavailableError,
  createJobWithApplication: mocks.createJobWithApplication,
}));

import { GET, POST } from "./route";

const VALID_COMPANY_ID = "123e4567-e89b-42d3-a456-426614174000";

function createRequest(
  body: string,
  origin = "http://localhost:3000",
  contentType = "application/json",
) {
  return new Request("http://localhost:3000/api/jobs", {
    method: "POST",
    headers: { "content-type": contentType, origin },
    body,
  });
}

describe("GET /api/jobs", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires authentication before processing list conditions", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost:3000/api/jobs?search=unsupported"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(mocks.listJobs).not.toHaveBeenCalled();
  });

  it("rejects unsupported or malformed pagination", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await GET(
      new Request("http://localhost:3000/api/jobs?page=1.0"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_QUERY_PARAMETER",
      fieldErrors: [{ field: "query.page", code: "INVALID_FORMAT" }],
    });
  });

  it("returns jobs with their current Application status", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.listJobs.mockResolvedValue({
      items: [{ id: "job-id", application: { status: "NOT_APPLIED" } }],
      pageInfo: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
    });

    const response = await GET(new Request("http://localhost:3000/api/jobs"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      items: [{ id: "job-id", application: { status: "NOT_APPLIED" } }],
    });
    expect(mocks.listJobs).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it("maps unexpected query failures to an internal error", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.listJobs.mockRejectedValue(new Error("database detail"));

    const response = await GET(new Request("http://localhost:3000/api/jobs"));
    const error = await response.json();

    expect(response.status).toBe(500);
    expect(error).toMatchObject({ code: "INTERNAL_ERROR" });
    expect(JSON.stringify(error)).not.toContain("database detail");
  });
});

describe("POST /api/jobs", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.resetAllMocks();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("enforces JSON parsing before authentication and hides field details", async () => {
    expect((await POST(createRequest("{"))).status).toBe(400);

    mocks.getSession.mockResolvedValue(null);
    const response = await POST(createRequest("{}"));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
  });

  it("checks origin before field validation", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await POST(createRequest("{}", "https://example.test"));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "ORIGIN_NOT_ALLOWED" });
  });

  it("returns ordered validation errors and rejects Application fields", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await POST(
      createRequest(JSON.stringify({ applicationStatus: "APPLIED" })),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: [
        { field: "jobName", code: "REQUIRED" },
        { field: "agentCompanyId", code: "REQUIRED" },
        { field: "workStyle", code: "REQUIRED" },
        { field: "applicationStatus", code: "UNKNOWN_FIELD" },
      ],
    });
    expect(mocks.createJobWithApplication).not.toHaveBeenCalled();
  });

  it("creates Job and initial Application and returns the detail location", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const job = {
      id: "job-id",
      jobName: "案件",
      application: { id: "application-id", status: "NOT_APPLIED" },
    };
    mocks.createJobWithApplication.mockResolvedValue(job);

    const response = await POST(
      createRequest(
        JSON.stringify({
          jobName: " 案件 ",
          agentCompanyId: VALID_COMPANY_ID,
          workStyle: "UNKNOWN",
        }),
      ),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe("/api/jobs/job-id");
    expect(await response.json()).toEqual(job);
    expect(mocks.createJobWithApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        jobName: "案件",
        agentCompanyId: VALID_COMPANY_ID,
        workStyle: "UNKNOWN",
        technologies: [],
        processPhases: [],
      }),
    );
  });

  it("returns not found when the introducing company is unavailable", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.createJobWithApplication.mockRejectedValue(
      new mocks.AgentCompanyUnavailableError(),
    );

    const response = await POST(
      createRequest(
        JSON.stringify({
          jobName: "案件",
          agentCompanyId: VALID_COMPANY_ID,
          workStyle: "HYBRID",
        }),
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "AGENT_COMPANY_NOT_FOUND",
    });
  });

  it("does not expose persistence errors", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.createJobWithApplication.mockRejectedValue(
      new Error("database detail"),
    );

    const response = await POST(
      createRequest(
        JSON.stringify({
          jobName: "案件",
          agentCompanyId: VALID_COMPANY_ID,
          workStyle: "HYBRID",
        }),
      ),
    );
    const error = await response.json();
    expect(response.status).toBe(500);
    expect(error).toMatchObject({ code: "INTERNAL_ERROR" });
    expect(JSON.stringify(error)).not.toContain("database detail");
  });
});
