import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReusableAnswerLibraryPanel } from "@/components/reusable-answers/reusable-answer-library-panel";

describe("ReusableAnswerLibraryPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads saved reusable answers and displays them", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reusableAnswers: [
            {
              id: "answer-1",
              questionId: "question-1",
              prompt: "Tell us about your leadership in STEM.",
              content: "Generated draft content",
              grounding: ["leadershipRoles"],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    render(React.createElement(ReusableAnswerLibraryPanel));

    expect(
      await screen.findByRole("heading", {
        name: /tell us about your leadership in stem/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/generated draft content/i)).toBeInTheDocument();
    expect(await screen.findByText(/leadershipRoles/i)).toBeInTheDocument();
  });
});
