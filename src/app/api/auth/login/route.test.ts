const authMocks = vi.hoisted(() => ({ handler: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: { handler: authMocks.handler },
}));

import { POST } from "@/app/api/auth/login/route";

function loginRequest(body: unknown) {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => authMocks.handler.mockReset());

  it("returns field errors before calling Better Auth", async () => {
    const response = await POST(loginRequest({ email: "", password: "" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "VALIDATION_ERROR",
      message: "入力内容を確認してください。",
      fieldErrors: [
        { field: "email", code: "REQUIRED", message: "入力してください。" },
        {
          field: "password",
          code: "REQUIRED",
          message: "入力してください。",
        },
      ],
    });
    expect(authMocks.handler).not.toHaveBeenCalled();
  });

  it("preserves the session cookie without exposing the token", async () => {
    authMocks.handler.mockResolvedValue(
      new Response(
        JSON.stringify({ token: "do-not-expose", user: { id: "1" } }),
        {
          status: 200,
          headers: {
            "set-cookie": "session=test; HttpOnly; SameSite=Lax; Path=/",
          },
        },
      ),
    );

    const response = await POST(
      loginRequest({ email: "USER@example.com", password: "password" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");

    const internalRequest = authMocks.handler.mock.calls[0]?.[0] as Request;
    expect(new URL(internalRequest.url).pathname).toBe(
      "/api/auth/sign-in/email",
    );
    expect(await internalRequest.json()).toEqual({
      email: "user@example.com",
      password: "password",
      rememberMe: true,
    });
  });

  it("maps Better Auth rate limiting to the application error", async () => {
    authMocks.handler.mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "x-retry-after": "10" },
      }),
    );

    const response = await POST(
      loginRequest({ email: "user@example.com", password: "password" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("10");
    expect(await response.json()).toMatchObject({ code: "RATE_LIMITED" });
  });
});
