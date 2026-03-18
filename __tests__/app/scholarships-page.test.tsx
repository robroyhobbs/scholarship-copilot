import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ScholarshipsPage from "@/app/scholarships/page";

vi.mock("@/components/scholarships/scholarship-workspace-panel", () => ({
  ScholarshipWorkspacePanel: () => <div>workspace panel</div>,
}));

describe("ScholarshipsPage", () => {
  it("frames scholarships as a guided application workflow", () => {
    render(React.createElement(ScholarshipsPage));

    expect(
      screen.getByRole("heading", {
        name: /turn a scholarship form into a working draft/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/paste the prompt, extract the questions, then draft with your saved story/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. paste or upload/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. extract the prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. draft and review/i)).toBeInTheDocument();
  });
});
