const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listAgentCompanies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/agent-companies/queries", () => ({
  listAgentCompanies: mocks.listAgentCompanies,
}));

import { GET } from "./route";

function listRequest(query = "") {
  return new Request(`http://localhost:3000/api/agent-companies${query}`);
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
