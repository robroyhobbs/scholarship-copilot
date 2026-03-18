import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, getScholarshipApplicationDetail, checkRateLimit } = vi.hoisted(
  () => ({
    getCurrentStudentUser: vi.fn(),
    getScholarshipApplicationDetail: vi.fn(),
    checkRateLimit: vi.fn(),
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

vi.mock("@/lib/security/request-limiter", () => ({
  checkRateLimit,
}));

import { GET } from "@/app/api/applications/[id]/export/route";

describe("GET /api/applications/[id]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("rate limits repeated export generation", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    checkRateLimit.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(429);
  });

  it("returns a review packet generated from the application detail", async () => {
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
          draft: {
            id: "draft-1",
            content: "Generated draft content",
            grounding: ["leadershipRoles"],
          },
        },
      ],
      checklist: {
        totalItems: 1,
        completedItems: 1,
        missingAttachmentPrompts: [],
        items: [],
      },
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.packet.title).toBe("STEM Leaders Scholarship");
    expect(body.packet.sections).toHaveLength(1);
    expect(body.packet.readyToSubmit).toBe(true);
  });
});
