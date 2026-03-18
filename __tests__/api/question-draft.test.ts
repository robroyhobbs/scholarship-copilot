import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  getQuestionForDraft,
  saveDraftResponse,
  readStudentProfileByUserId,
  checkRateLimit,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  getQuestionForDraft: vi.fn(),
  saveDraftResponse: vi.fn(),
  readStudentProfileByUserId: vi.fn(),
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
  saveDraftResponse,
}));

vi.mock("@/lib/security/request-limiter", () => ({
  checkRateLimit,
}));

import { POST } from "@/app/api/questions/[id]/draft/route";

describe("POST /api/questions/[id]/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("rate limits repeated draft generation", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    checkRateLimit.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });

    expect(response.status).toBe(429);
  });

  it("generates and stores a grounded draft response", async () => {
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
      academicInterests: ["Accessible software", "Education technology"],
      extracurriculars: ["Robotics Club"],
      leadershipRoles: ["Robotics Club captain"],
      volunteerWork: ["Coding mentor"],
      workExperience: [],
      awards: [],
      financialNeedContext: "",
      personalThemes: ["First-generation student"],
      familyBackground: "",
      signatureStories: [],
      writingPreferences: "",
      challengesAdversity: "",
    });
    getQuestionForDraft.mockResolvedValue({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      focusArea: "leadership_service",
      orderIndex: 0,
    });
    saveDraftResponse.mockResolvedValue({
      id: "draft-1",
      questionId: "question-1",
      content: "Draft content",
      grounding: ["leadershipRoles", "volunteerWork"],
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDraftResponse).toHaveBeenCalledWith("user-1", {
      applicationId: "app-1",
      questionId: "question-1",
      content: expect.stringContaining("Maya"),
      grounding: expect.arrayContaining(["leadershipRoles", "volunteerWork"]),
    });
    expect(body.draft.id).toBe("draft-1");
  });

  it("asks for more context instead of saving a weak draft", async () => {
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
      extracurriculars: [],
      leadershipRoles: [],
      volunteerWork: [],
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
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      focusArea: "leadership_service",
      orderIndex: 0,
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDraftResponse).not.toHaveBeenCalled();
    expect(body.needsMoreInfo).toBe(true);
    expect(body.followUpQuestions[0]).toMatch(/specific activity, project, or leadership example/i);
  });

  it("asks academic-goal follow-up questions when the profile lacks academic motivation", async () => {
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
      careerGoal: "",
      gpa: "",
      academicInterests: [],
      extracurriculars: [],
      leadershipRoles: [],
      volunteerWork: [],
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
      prompt: "Why do you want to study computer science?",
      type: "short_answer",
      focusArea: "academic_goals",
      orderIndex: 1,
      followUpAnswers: [],
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.needsMoreInfo).toBe(true);
    expect(body.followUpQuestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/what subject, class, project, or moment made this academic path feel real/i),
        expect.stringMatching(/what future role, field, or problem do you want your education to prepare you for/i),
      ]),
    );
  });
});
