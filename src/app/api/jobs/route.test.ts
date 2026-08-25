const mocks = vi.hoisted(() => ({ getSession: vi.fn(), listJobs: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/jobs/queries", () => ({ listJobs: mocks.listJobs }));

import { GET } from "./route";

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
