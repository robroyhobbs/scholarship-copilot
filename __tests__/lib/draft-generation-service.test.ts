import { beforeEach, describe, expect, it, vi } from "vitest";

const { GoogleGenAI, getVertexDraftRuntimeConfig } = vi.hoisted(() => ({
  GoogleGenAI: vi.fn(),
  getVertexDraftRuntimeConfig: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI,
}));

vi.mock("@/lib/vertex/config", () => ({
  getVertexDraftRuntimeConfig,
}));

import { generateDraftForQuestion } from "@/lib/drafts/draft-generation-service";

const baseProfile = {
  firstName: "Maya",
  lastName: "Carter",
  email: "maya@example.com",
  schoolName: "State University",
  academicYear: "junior" as const,
  intendedMajor: "Computer Science",
  careerGoal: "build tools that expand access to education",
  gpa: "3.9",
  extracurriculars: ["Robotics Club"],
  leadershipRoles: ["Robotics Club captain"],
  volunteerWork: ["Weekend coding mentor for middle school students"],
  workExperience: ["Peer tutor in the campus STEM center"],
  awards: ["Dean's List"],
  financialNeedContext: "I work part-time to help cover tuition and books.",
  personalThemes: ["First-generation student", "Community-minded builder"],
  writingPreferences: "Warm, direct, and reflective",
  challengesAdversity: "Balancing work hours with a full STEM course load",
};

const essayQuestion = {
  id: "question-1",
  prompt: "Tell us about your leadership in STEM and why it matters.",
  type: "essay" as const,
  focusArea: "leadership_service" as const,
  orderIndex: 0,
  wordLimit: null,
  characterLimit: null,
};

describe("generateDraftForQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVertexDraftRuntimeConfig.mockReturnValue(null);
  });

  it("falls back to deterministic grounded drafting when Vertex is not configured", async () => {
    const result = await generateDraftForQuestion(baseProfile, essayQuestion);

    expect(GoogleGenAI).not.toHaveBeenCalled();
    expect(result.content).toContain("Maya");
    expect(result.content).toContain("Computer Science");
    expect(result.grounding).toContain("leadershipRoles");
  });

  it("uses Vertex AI when runtime config is available", async () => {
    getVertexDraftRuntimeConfig.mockReturnValue({
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      model: "gemini-2.5-flash",
    });

    const generateContent = vi.fn().mockResolvedValue({
      text: "I led our robotics team through a redesign that taught me how collaborative STEM leadership can widen opportunity.",
    });
    GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
      return {
        models: {
          generateContent,
        },
      };
    });

    const result = await generateDraftForQuestion(baseProfile, essayQuestion);

    expect(GoogleGenAI).toHaveBeenCalledWith({
      vertexai: true,
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      apiVersion: "v1",
    });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        contents: expect.stringContaining("Tell us about your leadership in STEM"),
      }),
    );
    expect(result.content).toContain("robotics team");
    expect(result.grounding).toEqual(
      expect.arrayContaining(["leadershipRoles", "volunteerWork", "careerGoal"]),
    );
  });

  it("falls back to deterministic drafting when Vertex generation fails", async () => {
    getVertexDraftRuntimeConfig.mockReturnValue({
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      model: "gemini-2.5-flash",
    });

    const generateContent = vi.fn().mockRejectedValue(new Error("Vertex unavailable"));
    GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
      return {
        models: {
          generateContent,
        },
      };
    });

    const result = await generateDraftForQuestion(baseProfile, essayQuestion);

    expect(result.content).toContain("Maya");
    expect(result.content).toContain("Computer Science");
    expect(result.grounding).toContain("leadershipRoles");
  });

  it("passes explicit response limits to Vertex and trims the result to fit", async () => {
    getVertexDraftRuntimeConfig.mockReturnValue({
      project: "gen-lang-client-0405402450",
      location: "us-central1",
      model: "gemini-2.5-flash",
    });

    const generateContent = vi.fn().mockResolvedValue({
      text: "I lead with empathy collaboration precision and follow-through every day.",
    });
    GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
      return {
        models: {
          generateContent,
        },
      };
    });

    const result = await generateDraftForQuestion(baseProfile, {
      id: "question-2",
      prompt: "In 5 words or less, describe your leadership style.",
      type: "short_answer",
      focusArea: "leadership_service",
      orderIndex: 1,
      wordLimit: 5,
      characterLimit: null,
    });

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.stringContaining("Stay within 5 words."),
      }),
    );
    expect(result.content.split(/\s+/)).toHaveLength(5);
  });
});
