import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, getScholarshipApplicationDetail } = vi.hoisted(
  () => ({
    getCurrentStudentUser: vi.fn(),
    getScholarshipApplicationDetail: vi.fn(),
  }),
);

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/scholarships/application-repository", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/scholarships/application-repository")>(
      "@/lib/scholarships/application-repository",
    );

  return {
    ...actual,
    getScholarshipApplicationDetail,
  };
});

import { GET } from "@/app/api/applications/[id]/route";

describe("GET /api/applications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns the scholarship application detail", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    getScholarshipApplicationDetail.mockResolvedValue({
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
        },
      ],
      checklist: {
        totalItems: 1,
        completedItems: 0,
        missingAttachmentPrompts: [],
        items: [],
      },
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getScholarshipApplicationDetail).toHaveBeenCalledWith(
      "user-1",
      "app-1",
    );
    expect(body.application.questions).toHaveLength(1);
    expect(body.application.deadline).toBe("2026-04-15");
    expect(body.application.checklist.totalItems).toBe(1);
  });
});
