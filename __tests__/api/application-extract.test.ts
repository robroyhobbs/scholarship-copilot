import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  getScholarshipSourceForApplication,
  replaceApplicationQuestions,
  updateScholarshipExtraction,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  getScholarshipSourceForApplication: vi.fn(),
  replaceApplicationQuestions: vi.fn(),
  updateScholarshipExtraction: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/scholarships/application-repository", () => ({
  getScholarshipSourceForApplication,
  replaceApplicationQuestions,
  updateScholarshipExtraction,
}));

import { POST } from "@/app/api/applications/[id]/extract/route";

describe("POST /api/applications/[id]/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("extracts and persists structured scholarship questions", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    getScholarshipSourceForApplication.mockResolvedValue({
      scholarshipId: "scholarship-1",
      sourceText:
        "Deadline: April 15, 2026\nEssay Prompt: Tell us about your leadership in STEM.\nUpload your transcript.",
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(replaceApplicationQuestions).toHaveBeenCalledWith("app-1", "user-1", [
      {
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "Upload your transcript.",
        type: "attachment",
        orderIndex: 1,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
      },
    ]);
    expect(updateScholarshipExtraction).toHaveBeenCalledWith(
      "scholarship-1",
      "2026-04-15",
      "completed",
    );
    expect(body.questionCount).toBe(2);
    expect(body.deadline).toBe("2026-04-15");
  });
});
