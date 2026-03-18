import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentStudentUser, setAttachmentChecklistStatus } = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  setAttachmentChecklistStatus: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/checklist/checklist-repository", () => ({
  setAttachmentChecklistStatus,
}));

import { POST } from "@/app/api/questions/[id]/checklist/route";

describe("POST /api/questions/[id]/checklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ completed: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "question-2" }) },
    );

    expect(response.status).toBe(401);
  });

  it("marks an attachment question ready", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    setAttachmentChecklistStatus.mockResolvedValue({
      questionId: "question-2",
      status: "ready",
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ completed: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "question-2" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(setAttachmentChecklistStatus).toHaveBeenCalledWith(
      "user-1",
      "question-2",
      true,
    );
    expect(body.checklist.status).toBe("ready");
  });
});
