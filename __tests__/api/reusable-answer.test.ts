import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, saveReusableAnswerFromDraft } = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  saveReusableAnswerFromDraft: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/reusable-answers/repository", () => ({
  saveReusableAnswerFromDraft,
}));

import { POST } from "@/app/api/questions/[id]/reusable-answer/route";

describe("POST /api/questions/[id]/reusable-answer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("saves a generated draft into the reusable answer library", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    saveReusableAnswerFromDraft.mockResolvedValue({
      id: "answer-1",
      questionId: "question-1",
      prompt: "Tell us about your leadership in STEM.",
      content: "Generated draft content",
      grounding: ["leadershipRoles"],
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "question-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveReusableAnswerFromDraft).toHaveBeenCalledWith(
      "user-1",
      "question-1",
    );
    expect(body.reusableAnswer.id).toBe("answer-1");
  });
});
