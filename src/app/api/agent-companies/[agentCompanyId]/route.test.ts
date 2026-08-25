const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getAgentCompanyDetail: vi.fn(),
  updateAgentCompany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/agent-companies/queries", () => ({
  getAgentCompanyDetail: mocks.getAgentCompanyDetail,
}));

vi.mock("@/features/agent-companies/mutations", () => ({
  updateAgentCompany: mocks.updateAgentCompany,
}));

import { GET, PATCH } from "./route";

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function detailRequest(agentCompanyId: string) {
  return GET(
    new Request(`http://localhost:3000/api/agent-companies/${agentCompanyId}`),
    { params: Promise.resolve({ agentCompanyId }) },
  );
}

function updateRequest(
  agentCompanyId: string,
  body: string,
  origin = "http://localhost:3000",
) {
  return PATCH(
    new Request(`http://localhost:3000/api/agent-companies/${agentCompanyId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin },
      body,
    }),
    { params: Promise.resolve({ agentCompanyId }) },
  );
}

describe("GET /api/agent-companies/{agentCompanyId}", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.getAgentCompanyDetail.mockReset();
  });

  it("requires authentication before validating the path", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await detailRequest("invalid");

    expect(response.status).toBe(401);
    expect(mocks.getAgentCompanyDetail).not.toHaveBeenCalled();
  });

  it("rejects an invalid company id", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const response = await detailRequest("invalid");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_PATH_PARAMETER",
    });
    expect(mocks.getAgentCompanyDetail).not.toHaveBeenCalled();
  });

  it("does not expose a missing or logically deleted company", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.getAgentCompanyDetail.mockResolvedValue(null);

    const response = await detailRequest(VALID_ID);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "AGENT_COMPANY_NOT_FOUND",
    });
  });

  it("returns the company and all visible related jobs", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const company = {
      id: VALID_ID,
      companyName: "サンプルエージェント株式会社",
      contactName: "サンプル担当者",
      contactDetails: "sample@example.test",
      characteristics: null,
      status: "ACTIVE",
      lastContactDate: null,
      relatedJobs: [],
    };
    mocks.getAgentCompanyDetail.mockResolvedValue(company);

    const response = await detailRequest(VALID_ID);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(company);
    expect(mocks.getAgentCompanyDetail).toHaveBeenCalledWith(VALID_ID);
  });
});

describe("PATCH /api/agent-companies/{agentCompanyId}", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    mocks.getSession.mockReset();
    mocks.updateAgentCompany.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("does not expose field validation to an unauthenticated request", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await updateRequest(VALID_ID, "{}");

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(mocks.updateAgentCompany).not.toHaveBeenCalled();
  });

  it("rejects an invalid path and untrusted origin", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const originResponse = await updateRequest(
      VALID_ID,
      JSON.stringify({ companyName: "会社" }),
      "https://example.test",
    );
    expect(originResponse.status).toBe(403);

    const pathResponse = await updateRequest(
      "invalid",
      JSON.stringify({ companyName: "会社" }),
    );
    expect(pathResponse.status).toBe(400);
    expect(await pathResponse.json()).toMatchObject({
      code: "INVALID_PATH_PARAMETER",
    });
  });

  it("rejects an empty update and required-field clearing", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });

    const emptyResponse = await updateRequest(VALID_ID, "{}");
    expect(emptyResponse.status).toBe(422);
    expect(await emptyResponse.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "body", code: "EMPTY_UPDATE" }],
    });

    const requiredResponse = await updateRequest(
      VALID_ID,
      JSON.stringify({ companyName: "", status: null }),
    );
    expect(requiredResponse.status).toBe(422);
    expect(await requiredResponse.json()).toMatchObject({
      fieldErrors: [
        { field: "companyName", code: "REQUIRED" },
        { field: "status", code: "REQUIRED" },
      ],
    });
    expect(mocks.updateAgentCompany).not.toHaveBeenCalled();
  });

  it("updates provided fields, allows duplicate names, and clears optional values", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    const company = {
      id: VALID_ID,
      companyName: "同名会社",
      contactName: null,
      contactDetails: null,
      characteristics: null,
      lastContactDate: null,
      status: "ENDED",
      relatedJobs: [],
    };
    mocks.updateAgentCompany.mockResolvedValue(company);

    const response = await updateRequest(
      VALID_ID,
      JSON.stringify({
        companyName: "  同名会社 ",
        contactName: " ",
        status: "ENDED",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(company);
    expect(mocks.updateAgentCompany).toHaveBeenCalledWith(VALID_ID, {
      companyName: "同名会社",
      contactName: null,
      status: "ENDED",
    });
  });

  it("returns not found for a missing or deleted target", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-id" } });
    mocks.updateAgentCompany.mockResolvedValue(null);

    const response = await updateRequest(
      VALID_ID,
      JSON.stringify({ status: "ENDED" }),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      code: "AGENT_COMPANY_NOT_FOUND",
    });
  });
});
