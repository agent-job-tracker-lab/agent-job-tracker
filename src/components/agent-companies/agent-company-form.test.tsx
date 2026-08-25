import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AgentCompanyForm } from "./agent-company-form";

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

describe("AgentCompanyForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  it("starts with ACTIVE and exposes all decided fields", () => {
    render(<AgentCompanyForm />);

    expect(screen.getByLabelText(/会社名/u)).toBeVisible();
    expect(screen.getByLabelText(/担当者名/u)).toBeVisible();
    expect(screen.getByLabelText("連絡先")).toBeVisible();
    expect(screen.getByLabelText("特徴")).toBeVisible();
    expect(screen.getByLabelText("最終連絡日")).toBeVisible();
    expect(screen.getByLabelText(/関係状態/u)).toHaveValue("ACTIVE");
  });

  it("shows client errors and focuses the first invalid field", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<AgentCompanyForm />);

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText("入力内容を確認してください。"),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText(/会社名/u)).toHaveFocus());
  });

  it("normalizes input and moves to the created company detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "company-id" }), { status: 201 }),
    );
    const user = userEvent.setup();
    render(<AgentCompanyForm />);

    await user.type(screen.getByLabelText(/会社名/u), "  サンプル会社  ");
    await user.type(screen.getByLabelText(/担当者名/u), "   ");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/agent-companies/company-id"),
    );
    expect(refresh).toHaveBeenCalled();
    const request = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      companyName: "サンプル会社",
      contactName: null,
      contactDetails: null,
      characteristics: null,
      lastContactDate: null,
      status: "ACTIVE",
    });
  });

  it("keeps input and re-enables submit after a server failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "INTERNAL_ERROR",
          message: "処理に失敗しました。時間をおいてもう一度お試しください。",
          fieldErrors: [],
        }),
        { status: 500 },
      ),
    );
    const user = userEvent.setup();
    render(<AgentCompanyForm />);

    const companyName = screen.getByLabelText(/会社名/u);
    await user.type(companyName, "保持される会社");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText(
        "処理に失敗しました。時間をおいてもう一度お試しください。",
      ),
    ).toBeVisible();
    expect(companyName).toHaveValue("保持される会社");
    expect(screen.getByRole("button", { name: "登録する" })).toBeEnabled();
  });

  it("loads edit values and updates the existing company", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "company-id" }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <AgentCompanyForm
        mode="edit"
        companyId="company-id"
        initialValues={{
          companyName: "更新前会社",
          contactName: "更新前担当者",
          contactDetails: "before@example.test",
          characteristics: "更新前の特徴",
          lastContactDate: "2026-08-24",
          status: "ON_HOLD",
        }}
      />,
    );

    expect(screen.getByLabelText(/会社名/u)).toHaveValue("更新前会社");
    expect(screen.getByLabelText(/関係状態/u)).toHaveValue("ON_HOLD");

    await user.clear(screen.getByLabelText(/会社名/u));
    await user.type(screen.getByLabelText(/会社名/u), "更新後会社");
    await user.clear(screen.getByLabelText(/担当者名/u));
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/agent-companies/company-id"),
    );
    expect(refresh).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/agent-companies/company-id",
      expect.objectContaining({ method: "PATCH" }),
    );
    const request = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      companyName: "更新後会社",
      contactName: null,
      status: "ON_HOLD",
    });
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/agent-companies/company-id",
    );
  });
});
