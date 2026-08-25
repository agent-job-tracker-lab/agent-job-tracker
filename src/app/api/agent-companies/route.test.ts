const mocks = vi.hoisted(() => ({
  createAgentCompany: vi.fn(),
  getSession: vi.fn(),
  listAgentCompanies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/agent-companies/mutations", () => ({
  createAgentCompany: mocks.createAgentCompany,
}));

vi.mock("@/features/agent-companies/queries", () => ({
  listAgentCompanies: mocks.listAgentCompanies,
}));

import { GET, POST } from "./route";

function listRequest(query = "") {
  return new Request(`http://localhost:3000/api/agent-companies${query}`);
}

function createRequest(
  body: string,
  origin = "http://localhost:3000",
  contentType = "application/json",
) {
  return new Request("http://localhost:3000/api/agent-companies", {
    method: "POST",
    headers: {
      "content-type": contentType,
      origin,
    },
    body,
  });
}

describe("GET /api/agent-companies", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.listAgentCompanies.mockReset();
  });

  it("requires authentication before processing list conditions", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(listRequest("?search=not-supported"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(mocks.listAgentCompanies).not.toHaveBeenCalled();
  });

  it("rejects unsupported or malformed list conditions", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await GET(listRequest("?page=1.0"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_QUERY_PARAMETER",
      fieldErrors: [{ field: "query.page", code: "INVALID_FORMAT" }],
    });
    expect(mocks.listAgentCompanies).not.toHaveBeenCalled();
  });

  it("returns the paginated company list", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.listAgentCompanies.mockResolvedValue({
      items: [],
      pageInfo: { page: 2, pageSize: 10, totalCount: 0, totalPages: 0 },
    });

    const response = await GET(listRequest("?page=2&pageSize=10"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [],
      pageInfo: { page: 2, pageSize: 10, totalCount: 0, totalPages: 0 },
    });
    expect(mocks.listAgentCompanies).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
    });
  });
});

describe("POST /api/agent-companies", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    mocks.getSession.mockReset();
    mocks.createAgentCompany.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("enforces the JSON media type and body-size limit", async () => {
    const unsupportedResponse = await POST(
      createRequest(
        "{}",
        "http://localhost:3000",
        "application/json-patch+json",
      ),
    );
    expect(unsupportedResponse.status).toBe(415);

    const oversizedResponse = await POST(
      createRequest(
        "a".repeat(64 * 1024 + 1),
        "http://localhost:3000",
        "text/plain",
      ),
    );
    expect(oversizedResponse.status).toBe(413);
  });

  it("parses the JSON envelope before exposing validation details", async () => {
    const malformedResponse = await POST(createRequest("{"));
    expect(malformedResponse.status).toBe(400);
    expect(await malformedResponse.json()).toMatchObject({
      code: "INVALID_JSON",
    });

    mocks.getSession.mockResolvedValue(null);
    const unauthenticatedResponse = await POST(createRequest("{}"));
    expect(unauthenticatedResponse.status).toBe(401);
    expect(await unauthenticatedResponse.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(mocks.createAgentCompany).not.toHaveBeenCalled();
  });

  it("rejects an untrusted origin before field validation", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await POST(createRequest("{}", "https://example.test"));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "ORIGIN_NOT_ALLOWED" });
    expect(mocks.createAgentCompany).not.toHaveBeenCalled();

    const malformedOriginResponse = await POST(
      createRequest("{}", "http://localhost:3000/path"),
    );
    expect(malformedOriginResponse.status).toBe(403);
  });

  it("returns ordered field errors for invalid input", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await POST(createRequest("{}"));

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: [
        { field: "companyName", code: "REQUIRED" },
        { field: "status", code: "REQUIRED" },
      ],
    });
    expect(mocks.createAgentCompany).not.toHaveBeenCalled();
  });

  it("creates a duplicate-name-compatible company and returns its location", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const company = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      companyName: "同名会社",
      contactName: null,
      contactDetails: null,
      characteristics: null,
      lastContactDate: null,
      status: "ACTIVE",
      relatedJobs: [],
    };
    mocks.createAgentCompany.mockResolvedValue(company);

    const response = await POST(
      createRequest(
        JSON.stringify({ companyName: "  同名会社 ", status: "ACTIVE" }),
      ),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(
      `/api/agent-companies/${company.id}`,
    );
    expect(await response.json()).toEqual(company);
    expect(mocks.createAgentCompany).toHaveBeenCalledWith({
      companyName: "同名会社",
      contactName: null,
      contactDetails: null,
      characteristics: null,
      lastContactDate: null,
      status: "ACTIVE",
    });
  });

  it("returns an internal error without exposing persistence details", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.createAgentCompany.mockRejectedValue(new Error("database detail"));

    const response = await POST(
      createRequest(JSON.stringify({ companyName: "会社", status: "ACTIVE" })),
    );

    expect(response.status).toBe(500);
    const error = await response.json();
    expect(error).toMatchObject({ code: "INTERNAL_ERROR" });
    expect(JSON.stringify(error)).not.toContain("database detail");
  });
});
