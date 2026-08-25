const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getAgentCompanyDetail: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/agent-companies/queries", () => ({
  getAgentCompanyDetail: mocks.getAgentCompanyDetail,
}));

import { GET } from "./route";

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function detailRequest(agentCompanyId: string) {
  return GET(
    new Request(`http://localhost:3000/api/agent-companies/${agentCompanyId}`),
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
