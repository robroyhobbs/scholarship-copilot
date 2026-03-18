import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  getScholarshipApplicationDetail,
  createApplicationVersionSnapshot,
  listApplicationVersions,
  checkRateLimit,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  getScholarshipApplicationDetail: vi.fn(),
  createApplicationVersionSnapshot: vi.fn(),
  listApplicationVersions: vi.fn(),
  checkRateLimit: vi.fn(),
}));

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

vi.mock("@/lib/versions/application-version-repository", () => ({
  createApplicationVersionSnapshot,
  listApplicationVersions,
}));

vi.mock("@/lib/security/request-limiter", () => ({
  checkRateLimit,
}));

import { GET, POST } from "@/app/api/applications/[id]/versions/route";

describe("GET/POST /api/applications/[id]/versions", () => {
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

  it("rate limits repeated snapshot creation", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    checkRateLimit.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(429);
  });

  it("lists saved snapshots", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    listApplicationVersions.mockResolvedValue([
      {
        id: "version-1",
        applicationId: "app-1",
        createdAt: "2026-03-16T18:00:00.000Z",
        readyToSubmit: false,
        sectionCount: 1,
      },
    ]);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listApplicationVersions).toHaveBeenCalledWith("user-1", "app-1");
    expect(body.versions).toHaveLength(1);
  });

  it("creates a new snapshot from the current export packet", async () => {
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
    createApplicationVersionSnapshot.mockResolvedValue({
      id: "version-2",
      applicationId: "app-1",
      createdAt: "2026-03-16T19:00:00.000Z",
      readyToSubmit: true,
      sectionCount: 1,
    });

    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: "app-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createApplicationVersionSnapshot).toHaveBeenCalledWith(
      "user-1",
      "app-1",
      expect.objectContaining({
        title: "STEM Leaders Scholarship",
        readyToSubmit: true,
      }),
    );
    expect(body.version.id).toBe("version-2");
  });
});
