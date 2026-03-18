import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, listReusableAnswers } = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  listReusableAnswers: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/reusable-answers/repository", () => ({
  listReusableAnswers,
}));

import { GET } from "@/app/api/reusable-answers/route";

describe("GET /api/reusable-answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"));

    expect(response.status).toBe(401);
  });

  it("returns the user's reusable answer library", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    listReusableAnswers.mockResolvedValue([
      {
        id: "answer-1",
        questionId: "question-1",
        prompt: "Tell us about your leadership in STEM.",
        content: "Generated draft content",
        grounding: ["leadershipRoles"],
      },
    ]);

    const response = await GET(new Request("http://localhost"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listReusableAnswers).toHaveBeenCalledWith("user-1");
    expect(body.reusableAnswers).toHaveLength(1);
  });
});
