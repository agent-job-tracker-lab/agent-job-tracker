import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("shows the local environment ready message", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Agent Job Tracker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sprint 1の機能実装を開始するためのローカル開発環境が起動しています。",
      ),
    ).toBeInTheDocument();
  });
});
