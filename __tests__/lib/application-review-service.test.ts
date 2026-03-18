import { beforeEach, describe, expect, it, vi } from "vitest";

const { GoogleGenAI, getVertexReviewRuntimeConfig } = vi.hoisted(() => ({
  GoogleGenAI: vi.fn(),
  getVertexReviewRuntimeConfig: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI,
}));

vi.mock("@/lib/vertex/config", () => ({
  getVertexReviewRuntimeConfig,
}));

import { reviewApplicationPacket } from "@/lib/review/application-review-service";

const packet = {
  title: "Bright Futures STEM Scholarship",
  sponsorName: "Bright Futures Foundation",
  deadline: "2026-04-15",
  readyToSubmit: false,
  missingItems: ["Upload your transcript."],
  privacyWarnings: ["Contains an email address"],
  sections: [
    {
      questionId: "question-1",
      kind: "response" as const,
      heading: "Tell us about your leadership in STEM.",
      body: "I led our robotics team and mentored younger students in our community makerspace.",
      redactedBody:
        "I led our robotics team and mentored younger students in our community makerspace.",
    },
  ],
};

describe("reviewApplicationPacket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVertexReviewRuntimeConfig.mockReturnValue(null);
  });

  it("returns a deterministic fallback review when Vertex review is unavailable", async () => {
    const result = await reviewApplicationPacket(packet);

    expect(GoogleGenAI).not.toHaveBeenCalled();
    expect(result.model).toBe("fallback-review");
    expect(result.risks).toContain("Upload the remaining required attachment before submission.");
    expect(result.risks).toContain("Remove or redact private contact details before copying the final packet.");
  });

  it("uses Vertex review when runtime config is available", async () => {
    getVertexReviewRuntimeConfig.mockReturnValue({
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      model: "gemini-2.5-pro",
    });

    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        summary: "Strong application story with one operational gap.",
        strengths: ["Specific STEM leadership example", "Clear service orientation"],
        risks: ["Transcript still missing"],
        revisionPriorities: ["Tighten the opening sentence", "Remove contact info from copied draft"],
      }),
    });

    GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
      return {
        models: {
          generateContent,
        },
      };
    });

    const result = await reviewApplicationPacket(packet);

    expect(GoogleGenAI).toHaveBeenCalledWith({
      vertexai: true,
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      apiVersion: "v1",
    });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-pro",
        contents: expect.stringContaining("Bright Futures STEM Scholarship"),
      }),
    );
    expect(result.model).toBe("gemini-2.5-pro");
    expect(result.summary).toContain("Strong application story");
    expect(result.strengths).toContain("Specific STEM leadership example");
  });
});
