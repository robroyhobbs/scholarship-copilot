import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  getScholarshipApplicationDetail,
  checkRateLimit,
  reviewApplicationPacket,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  getScholarshipApplicationDetail: vi.fn(),
  checkRateLimit: vi.fn(),
  reviewApplicationPacket: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/scholarships/application-repository", () => ({
  getScholarshipApplicationDetail,
}));

vi.mock("@/lib/security/request-limiter", () => ({
  checkRateLimit,
}));

vi.mock("@/lib/review/application-review-service", () => ({
  reviewApplicationPacket,
}));

import { POST } from "@/app/api/applications/[id]/review/route";

describe("POST /api/applications/[id]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns an AI review for the application packet", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    getScholarshipApplicationDetail.mockResolvedValue({
      id: "app-1",
      scholarshipId: "app-1",
      title: "Bright Futures STEM Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      status: "draft",
      deadline: "2026-04-15",
      questions: [],
      checklist: {
        totalItems: 1,
        completedItems: 0,
        missingAttachmentPrompts: ["Upload your transcript."],
        items: [],
      },
    });
    reviewApplicationPacket.mockResolvedValue({
      summary: "Strong application story with one operational gap.",
      strengths: ["Specific STEM leadership example"],
      risks: ["Transcript still missing"],
      revisionPriorities: ["Tighten the opening sentence"],
      model: "gemini-2.5-pro",
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reviewApplicationPacket).toHaveBeenCalled();
    expect(body.review.model).toBe("gemini-2.5-pro");
    expect(body.review.strengths).toEqual(["Specific STEM leadership example"]);
  });
});
