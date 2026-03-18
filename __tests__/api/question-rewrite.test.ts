import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  getQuestionForDraft,
  saveDraftResponse,
  readStudentProfileByUserId,
  readDraftResponse,
  checkRateLimit,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  getQuestionForDraft: vi.fn(),
  saveDraftResponse: vi.fn(),
  readStudentProfileByUserId: vi.fn(),
  readDraftResponse: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/profile/profile-repository", () => ({
  readStudentProfileByUserId,
}));

vi.mock("@/lib/drafts/draft-repository", () => ({
  getQuestionForDraft,
  readDraftResponse,
  saveDraftResponse,
}));

vi.mock("@/lib/security/request-limiter", () => ({
  checkRateLimit,
}));

import { POST } from "@/app/api/questions/[id]/rewrite/route";

describe("POST /api/questions/[id]/rewrite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "shorten_to_limit" }),
      }),
      {
        params: Promise.resolve({ id: "question-1" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("shortens an existing draft to fit question limits and saves it", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    readStudentProfileByUserId.mockResolvedValue({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
      gpa: "",
      academicInterests: [],
      extracurriculars: ["Robotics Club"],
      leadershipRoles: ["Robotics Club captain"],
      volunteerWork: ["Coding mentor"],
      workExperience: [],
      awards: [],
      financialNeedContext: "",
      personalThemes: [],
      familyBackground: "",
      signatureStories: [],
      writingPreferences: "",
      challengesAdversity: "",
    });
    getQuestionForDraft.mockResolvedValue({
      id: "question-1",
      applicationId: "app-1",
      prompt: "In 5 words or less, describe your leadership style.",
      type: "short_answer",
      focusArea: "leadership_service",
      orderIndex: 0,
      wordLimit: 5,
      characterLimit: null,
      followUpAnswers: [],
    });
    readDraftResponse.mockResolvedValue({
      id: "question-1",
      questionId: "question-1",
      content:
        "Thoughtful collaborative service-driven leadership style for community teams",
      grounding: ["leadershipRoles"],
    });
    saveDraftResponse.mockResolvedValue({
      id: "question-1",
      questionId: "question-1",
      content: "Thoughtful collaborative service-driven leadership style",
      grounding: ["leadershipRoles"],
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shorten_to_limit" }),
      }),
      {
        params: Promise.resolve({ id: "question-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDraftResponse).toHaveBeenCalledWith("user-1", {
      applicationId: "app-1",
      questionId: "question-1",
      content: "Thoughtful collaborative service-driven leadership style",
      grounding: ["leadershipRoles"],
    });
    expect(body.draft.content.split(/\s+/)).toHaveLength(5);
  });

  it("tightens the opening of an existing draft and saves it", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    readStudentProfileByUserId.mockResolvedValue({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
      gpa: "",
      academicInterests: [],
      extracurriculars: ["Robotics Club"],
      leadershipRoles: ["Robotics Club captain"],
      volunteerWork: ["Coding mentor"],
      workExperience: [],
      awards: [],
      financialNeedContext: "",
      personalThemes: [],
      familyBackground: "",
      signatureStories: [],
      writingPreferences: "",
      challengesAdversity: "",
    });
    getQuestionForDraft.mockResolvedValue({
      id: "question-2",
      applicationId: "app-1",
      prompt: "Tell us about a leadership experience that shaped you.",
      type: "essay",
      focusArea: "leadership_service",
      orderIndex: 1,
      wordLimit: null,
      characterLimit: null,
      followUpAnswers: [],
    });
    readDraftResponse.mockResolvedValue({
      id: "draft-2",
      questionId: "question-2",
      content:
        "During my sophomore year, I led a robotics rebuild that forced me to listen better and delegate clearly. That experience changed how I show up for newer teammates.",
      grounding: ["leadershipRoles"],
    });
    saveDraftResponse.mockImplementation(async (_userId: string, input: { content: string }) => ({
      id: "draft-2",
      questionId: "question-2",
      content: input.content,
      grounding: ["leadershipRoles"],
    }));

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tighten_opening" }),
      }),
      {
        params: Promise.resolve({ id: "question-2" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDraftResponse).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        applicationId: "app-1",
        questionId: "question-2",
        content: expect.not.stringContaining("During my sophomore year,"),
      }),
    );
    expect(body.draft.content).toContain("That experience changed how I show up for newer teammates.");
  });
});
