import { describe, expect, it } from "vitest";
import { extractScholarshipDetails } from "@/lib/scholarships/extraction";

describe("extractScholarshipDetails", () => {
  it("extracts deadlines and common scholarship question patterns", () => {
    const result = extractScholarshipDetails(`
      Bright Futures Foundation STEM Leaders Scholarship
      Deadline: April 15, 2026

      Essay Prompt: Tell us about a time you used leadership to improve a STEM community.
      Question 2: How will this scholarship support your education goals?
      Upload your transcript and one resume.
    `);

    expect(result.deadline).toBe("2026-04-15");
    expect(result.questions).toEqual([
      {
        prompt:
          "Tell us about a time you used leadership to improve a STEM community.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "How will this scholarship support your education goals?",
        type: "short_answer",
        orderIndex: 1,
        focusArea: "financial_need",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "Upload your transcript and one resume.",
        type: "attachment",
        orderIndex: 2,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
      },
    ]);
  });

  it("extracts labeled prompts from pasted paragraph-style scholarship text", () => {
    const result = extractScholarshipDetails(
      "Future Builders Scholarship Application Deadline: April 15, 2026. Essay Prompt: Describe a time you used technology to improve your community. Short Answer: Why do you want to study computer science? Attachment Requirement: Upload an unofficial transcript.",
    );

    expect(result.deadline).toBe("2026-04-15");
    expect(result.questions).toEqual([
      {
        prompt: "Describe a time you used technology to improve your community.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "Why do you want to study computer science?",
        type: "short_answer",
        orderIndex: 1,
        focusArea: "academic_goals",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "Upload an unofficial transcript.",
        type: "attachment",
        orderIndex: 2,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
      },
    ]);
  });

  it("extracts word and character limits from scholarship prompts", () => {
    const result = extractScholarshipDetails(`
      Essay Prompt: In 500 words or less, describe a challenge that shaped your goals.
      Short Answer: In 250-500 words, explain how this scholarship would support your future.
      Question 3: Share your leadership philosophy in 280 characters.
    `);

    expect(result.questions).toEqual([
      expect.objectContaining({
        type: "essay",
        wordLimit: 500,
        characterLimit: null,
      }),
      expect.objectContaining({
        type: "short_answer",
        wordLimit: 500,
        characterLimit: null,
      }),
      expect.objectContaining({
        type: "short_answer",
        wordLimit: null,
        characterLimit: 280,
      }),
    ]);
  });
});
