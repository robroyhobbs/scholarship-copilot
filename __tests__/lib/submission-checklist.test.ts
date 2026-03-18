import { describe, expect, it } from "vitest";
import { buildSubmissionChecklist } from "@/lib/checklist/submission-checklist";

describe("buildSubmissionChecklist", () => {
  it("counts completed drafts and flags missing attachments", () => {
    const checklist = buildSubmissionChecklist([
      {
        id: "question-1",
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
        draft: {
          id: "draft-1",
          content: "Generated draft content",
          grounding: ["leadershipRoles"],
        },
      },
      {
        id: "question-2",
        prompt: "Upload your transcript.",
        type: "attachment",
        orderIndex: 1,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
        attachmentReady: false,
      },
    ]);

    expect(checklist.completedItems).toBe(1);
    expect(checklist.totalItems).toBe(2);
    expect(checklist.missingAttachmentPrompts).toEqual(["Upload your transcript."]);
    expect(checklist.items[1]).toMatchObject({
      questionId: "question-2",
      kind: "attachment",
      status: "missing",
    });
  });

  it("flags over-limit response drafts as needing revision", () => {
    const checklist = buildSubmissionChecklist([
      {
        id: "question-1",
        prompt: "In 5 words or less, describe your leadership style.",
        type: "short_answer",
        focusArea: "leadership_service",
        orderIndex: 0,
        wordLimit: 5,
        characterLimit: null,
        draft: {
          id: "draft-1",
          content: "Thoughtful collaborative service-driven leadership style for community teams",
          grounding: ["leadershipRoles"],
        },
      },
    ]);

    expect(checklist.completedItems).toBe(0);
    expect(checklist.items[0]).toMatchObject({
      kind: "response",
      status: "needs_revision",
    });
    expect(checklist.revisionRequiredPrompts).toEqual([
      "In 5 words or less, describe your leadership style.",
    ]);
    expect(checklist.items[0].note).toMatch(/above the 5-word limit/i);
  });
});
