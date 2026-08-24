import { loginRequestSchema, toLoginFieldErrors } from "@/lib/auth/login-input";

describe("loginRequestSchema", () => {
  it("normalizes only the email address", () => {
    const result = loginRequestSchema.parse({
      email: "  USER@Example.COM  ",
      password: " password ",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: " password ",
    });
  });

  it("returns one actionable error for each field", () => {
    const result = loginRequestSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toLoginFieldErrors(result.error)).toEqual([
      { field: "email", code: "REQUIRED", message: "入力してください。" },
      { field: "password", code: "REQUIRED", message: "入力してください。" },
    ]);
  });

  it("rejects unknown fields", () => {
    expect(
      loginRequestSchema.safeParse({
        email: "user@example.com",
        password: "password",
        rememberMe: true,
      }).success,
    ).toBe(false);
  });
});
