import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { JobForm } from "./job-form";

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();
const companies = [
  {
    id: "123e4567-e89b-42d3-a456-426614174000",
    companyName: "紹介元会社",
  },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

describe("JobForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  it("does not preselect a work style", () => {
    render(<JobForm companies={companies} />);

    expect(screen.getByLabelText("勤務形態必須")).toHaveValue("");
    expect(screen.getByLabelText(/紹介元エージェント会社/u)).toHaveValue("");
  });

  it("shows client errors and focuses the first invalid field", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<JobForm companies={companies} />);

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText("入力内容を確認してください。"),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText(/案件名/u)).toHaveFocus());
  });

  it("converts form values and moves to the created detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "job-id" }), { status: 201 }),
    );
    const user = userEvent.setup();
    render(<JobForm companies={companies} />);

    await user.type(screen.getByLabelText(/案件名/u), "登録案件");
    await user.selectOptions(
      screen.getByLabelText(/紹介元エージェント会社/u),
      companies[0]!.id,
    );
    await user.selectOptions(screen.getByLabelText("勤務形態必須"), "HYBRID");
    await user.type(screen.getByLabelText("単価下限（万円）"), "60.25");
    await user.type(screen.getByLabelText("稼働率（%）"), "80.5");
    await user.type(screen.getByLabelText(/技術/u), "TypeScript{enter}Next.js");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/jobs/job-id"));
    expect(refresh).toHaveBeenCalled();
    const request = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(request?.[0]).toBe("/api/jobs");
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      jobName: "登録案件",
      agentCompanyId: companies[0]!.id,
      workStyle: "HYBRID",
      monthlyRateMinYen: 602_500,
      utilizationPercent: 80.5,
      technologies: ["TypeScript", "Next.js"],
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
    render(<JobForm companies={companies} />);

    await user.type(screen.getByLabelText(/案件名/u), "保持される案件");
    await user.selectOptions(
      screen.getByLabelText(/紹介元エージェント会社/u),
      companies[0]!.id,
    );
    await user.selectOptions(screen.getByLabelText("勤務形態必須"), "UNKNOWN");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText(
        "処理に失敗しました。時間をおいてもう一度お試しください。",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText(/案件名/u)).toHaveValue("保持される案件");
    expect(screen.getByRole("button", { name: "登録する" })).toBeEnabled();
  });
});
