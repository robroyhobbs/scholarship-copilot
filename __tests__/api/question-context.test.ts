import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  updateScholarshipQuestionFollowUpAnswers,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  updateScholarshipQuestionFollowUpAnswers: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/scholarships/question-repository", () => ({
  updateScholarshipQuestionFollowUpAnswers,
}));

import { POST } from "@/app/api/questions/[id]/context/route";

describe("POST /api/questions/[id]/context", () => {
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

  it("saves scholarship-specific follow-up answers", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    updateScholarshipQuestionFollowUpAnswers.mockResolvedValue({
      id: "question-1",
      followUpAnswers: [
        "I led our robotics intake redesign project.",
        "It improved match consistency and helped newer teammates contribute.",
      ],
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpAnswers: [
            "I led our robotics intake redesign project.",
            "It improved match consistency and helped newer teammates contribute.",
          ],
        }),
      }),
      {
        params: Promise.resolve({ id: "question-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateScholarshipQuestionFollowUpAnswers).toHaveBeenCalledWith(
      "user-1",
      "question-1",
      [
        "I led our robotics intake redesign project.",
        "It improved match consistency and helped newer teammates contribute.",
      ],
    );
    expect(body.question.followUpAnswers).toHaveLength(2);
  });
});
