import { describe, expect, it } from "vitest";
import { findReusableAnswerSuggestions } from "@/lib/reusable-answers/matching";

describe("findReusableAnswerSuggestions", () => {
  it("returns the best prompt-overlap matches first", () => {
    const suggestions = findReusableAnswerSuggestions(
      "Tell us about your leadership in STEM and community service.",
      [
        {
          id: "answer-1",
          prompt: "Describe your leadership in STEM clubs.",
          content: "I led the robotics team.",
          grounding: ["leadershipRoles"],
        },
        {
          id: "answer-2",
          prompt: "What are your artistic influences?",
          content: "I enjoy illustration.",
          grounding: ["personalThemes"],
        },
        {
          id: "answer-3",
          prompt: "How do you serve your community through tutoring?",
          content: "I mentor younger students each weekend.",
          grounding: ["volunteerWork"],
        },
      ],
    );

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((suggestion) => suggestion.id)).toEqual([
      "answer-1",
      "answer-3",
    ]);
  });
});
