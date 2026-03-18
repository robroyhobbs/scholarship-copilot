import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, seedDemoWorkspaceForUser } = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  seedDemoWorkspaceForUser: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/demo/seed-demo", () => ({
  seedDemoWorkspaceForUser,
}));

import { POST } from "@/app/api/demo-seed/route";

describe("POST /api/demo-seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/demo-seed"));

    expect(response.status).toBe(401);
  });

  it("seeds demo data for the current student", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    seedDemoWorkspaceForUser.mockResolvedValue({
      applicationId: "demo-app-1",
      applications: [
        {
          id: "demo-app-1",
          scholarshipId: "demo-app-1",
          title: "Bright Futures STEM Scholarship",
          sponsorName: "Bright Futures Foundation",
          sourceType: "paste",
          status: "draft",
          extractionStatus: "completed",
          deadline: "2026-04-15",
          questionCount: 3,
          createdAt: "2026-03-16T10:00:00.000Z",
        },
      ],
    });

    const response = await POST(new Request("http://localhost/api/demo-seed"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(seedDemoWorkspaceForUser).toHaveBeenCalledWith("user-1", "maya@example.com");
    expect(body.applicationId).toBe("demo-app-1");
    expect(body.applications).toHaveLength(1);
  });
});
