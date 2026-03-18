import { describe, expect, it } from "vitest";
import { buildApplicationExport } from "@/lib/export/application-export";

describe("buildApplicationExport", () => {
  it("builds a copy-friendly review packet from application detail", () => {
    const packet = buildApplicationExport({
      id: "app-1",
      scholarshipId: "scholarship-1",
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      status: "draft",
      extractionStatus: "completed",
      deadline: "2026-04-15",
      questions: [
        {
          id: "question-1",
          prompt: "Tell us about your leadership in STEM.",
          type: "essay",
          orderIndex: 0,
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
          attachmentReady: true,
        },
      ],
      checklist: {
        totalItems: 2,
        completedItems: 2,
        missingAttachmentPrompts: [],
        items: [],
      },
    });

    expect(packet.title).toBe("STEM Leaders Scholarship");
    expect(packet.readyToSubmit).toBe(true);
    expect(packet.privacyWarnings).toEqual([]);
    expect(packet.sections).toEqual([
      expect.objectContaining({
        questionId: "question-1",
        heading: "Tell us about your leadership in STEM.",
        body: "Generated draft content",
        redactedBody: "Generated draft content",
      }),
      expect.objectContaining({
        questionId: "question-2",
        heading: "Upload your transcript.",
        body: "Attachment marked ready by student.",
        redactedBody: "Attachment marked ready by student.",
      }),
    ]);
  });

  it("flags privacy risks and prevents a ready state when obvious PII is present", () => {
    const packet = buildApplicationExport({
      id: "app-1",
      scholarshipId: "scholarship-1",
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      status: "draft",
      extractionStatus: "completed",
      deadline: "2026-04-15",
      questions: [
        {
          id: "question-1",
          prompt: "Tell us how to reach you.",
          type: "short_answer",
          orderIndex: 0,
          draft: {
            id: "draft-1",
            content: "Email me at maya@example.com or call 555-123-4567.",
            grounding: ["questionPrompt"],
          },
        },
      ],
      checklist: {
        totalItems: 1,
        completedItems: 1,
        missingAttachmentPrompts: [],
        items: [],
      },
    });

    expect(packet.readyToSubmit).toBe(false);
    expect(packet.privacyWarnings).toContain("Contains an email address");
    expect(packet.privacyWarnings).toContain("Contains a phone number");
    expect(packet.sections[0].redactedBody).toContain("[redacted email]");
    expect(packet.sections[0].redactedBody).toContain("[redacted phone]");
  });
});
