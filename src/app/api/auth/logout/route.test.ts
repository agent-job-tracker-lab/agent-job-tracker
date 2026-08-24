const authMocks = vi.hoisted(() => ({
  handler: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    handler: authMocks.handler,
    api: { getSession: authMocks.getSession },
  },
}));

import { POST } from "@/app/api/auth/logout/route";

function logoutRequest() {
  return new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: "session=test",
      origin: "http://localhost:3000",
    },
  });
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    authMocks.handler.mockReset();
    authMocks.getSession.mockReset();
  });

  it("rejects a request without an active session", async () => {
    authMocks.getSession.mockResolvedValue(null);

    const response = await POST(logoutRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(authMocks.handler).not.toHaveBeenCalled();
  });

  it("invalidates the server session and forwards the expired cookie", async () => {
    authMocks.getSession.mockResolvedValue({
      session: { id: "session-id" },
      user: { id: "user-id" },
    });
    authMocks.handler.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "set-cookie": "session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/",
        },
      }),
    );

    const response = await POST(logoutRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    const internalRequest = authMocks.handler.mock.calls[0]?.[0] as Request;
    expect(new URL(internalRequest.url).pathname).toBe("/api/auth/sign-out");
  });
});
