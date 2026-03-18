import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("shows the student-facing scholarship workflow", () => {
    render(React.createElement(HomePage));

    expect(
      screen.getByRole("heading", { name: /scholarship copilot/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/finish stronger scholarship applications without starting over/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start your profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open application workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/three moves, one repeatable system/i),
    ).toBeInTheDocument();
  });
});
