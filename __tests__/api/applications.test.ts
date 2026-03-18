import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  createScholarshipWorkspace,
  listScholarshipApplications,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  createScholarshipWorkspace: vi.fn(),
  listScholarshipApplications: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/scholarships/application-repository", () => ({
  createScholarshipWorkspace,
  listScholarshipApplications,
}));

import { GET, POST } from "@/app/api/applications/route";

describe("GET /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns the student's scholarship workspaces", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    listScholarshipApplications.mockResolvedValue([
      {
        id: "app-1",
        title: "STEM Leaders Scholarship",
        sponsorName: "Bright Futures Foundation",
        status: "draft",
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listScholarshipApplications).toHaveBeenCalledWith("user-1");
    expect(body.applications).toHaveLength(1);
  });
});

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a workspace from pasted scholarship content", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    createScholarshipWorkspace.mockResolvedValue({
      id: "app-1",
      scholarshipId: "scholarship-1",
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      status: "draft",
    });

    const response = await POST(
      new Request("http://localhost/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "STEM Leaders Scholarship",
          sponsorName: "Bright Futures Foundation",
          sourceType: "paste",
          sourceText:
            "Essay prompt: Tell us about your leadership in STEM and why it matters.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createScholarshipWorkspace).toHaveBeenCalledWith("user-1", {
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      sourceText:
        "Essay prompt: Tell us about your leadership in STEM and why it matters.",
    });
    expect(body.application.id).toBe("app-1");
  });

  it("requires source text for pasted applications", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });

    const response = await POST(
      new Request("http://localhost/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "STEM Leaders Scholarship",
          sourceType: "paste",
          sourceText: "",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid scholarship workspace/i);
  });
});
