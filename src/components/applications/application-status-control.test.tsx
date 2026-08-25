import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApplicationStatusControl } from "./application-status-control";

const refresh = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace }),
}));

describe("ApplicationStatusControl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
    replace.mockReset();
  });

  it("offers every status and disables an unchanged update", () => {
    render(
      <ApplicationStatusControl
        jobId="job-id"
        jobName="案件A"
        currentStatus="NOT_APPLIED"
      />,
    );

    expect(screen.getByLabelText("案件Aの応募ステータス")).toHaveValue(
      "NOT_APPLIED",
    );
    expect(screen.getAllByRole("option")).toHaveLength(9);
    expect(screen.getByRole("button", { name: "更新" })).toBeDisabled();
  });

  it("updates in place and disables the newly saved value", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "APPLIED" }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <ApplicationStatusControl
        jobId="job-id"
        jobName="案件A"
        currentStatus="NOT_APPLIED"
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("案件Aの応募ステータス"),
      "APPLIED",
    );
    await user.click(screen.getByRole("button", { name: "更新" }));

    expect(
      await screen.findByText("応募ステータスを更新しました。"),
    ).toBeVisible();
    expect(screen.getByLabelText("案件Aの応募ステータス")).toHaveValue(
      "APPLIED",
    );
    expect(screen.getByRole("button", { name: "更新" })).toBeDisabled();
    expect(refresh).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/jobs/job-id/application/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "APPLIED" }),
      }),
    );
  });

  it("keeps the selected value available for retry after a failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "更新に失敗しました。" }), {
        status: 500,
      }),
    );
    const user = userEvent.setup();
    render(
      <ApplicationStatusControl
        jobId="job-id"
        jobName="案件A"
        currentStatus="NOT_APPLIED"
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("案件Aの応募ステータス"),
      "REJECTED",
    );
    await user.click(screen.getByRole("button", { name: "更新" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "更新に失敗しました。",
    );
    expect(screen.getByLabelText("案件Aの応募ステータス")).toHaveValue(
      "REJECTED",
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "更新" })).toBeEnabled(),
    );
  });
});
