import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/components/auth/login-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it("moves to the job list after a successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "user@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/jobs"));
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the email and clears the password after an authentication error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません。",
          fieldErrors: [],
        }),
        { status: 401 },
      ),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    const email = screen.getByLabelText("メールアドレス");
    const password = screen.getByLabelText("パスワード");
    await user.type(email, "user@example.com");
    await user.type(password, "wrong-password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません。",
      ),
    ).toBeVisible();
    expect(email).toHaveValue("user@example.com");
    expect(password).toHaveValue("");
    await waitFor(() => expect(password).toHaveFocus());
  });

  it("prevents duplicate submissions while the first request is pending", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "user@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(screen.getByRole("button", { name: "ログイン中…" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveRequest?.(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/jobs"));
  });
});
