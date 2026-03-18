import { beforeEach, describe, expect, it, vi } from "vitest";

const { readScholarshipQuestionById } = vi.hoisted(() => ({
  readScholarshipQuestionById: vi.fn(),
}));

const { checklistDocs, getFirebaseAdminDb } = vi.hoisted(() => {
  const checklistDocs = new Map<string, Record<string, unknown>>();

  const getFirebaseAdminDb = vi.fn(() => ({
    collection(name: string) {
      if (name !== "submissionChecklists") {
        throw new Error(`Unexpected collection ${name}`);
      }

      return {
        doc(id: string) {
          return {
            async set(data: Record<string, unknown>) {
              checklistDocs.set(id, {
                ...(checklistDocs.get(id) ?? {}),
                ...data,
              });
            },
            async delete() {
              checklistDocs.delete(id);
            },
          };
        },
      };
    },
  }));

  return {
    checklistDocs,
    getFirebaseAdminDb,
  };
});

vi.mock("@/lib/scholarships/question-repository", () => ({
  readScholarshipQuestionById,
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import { setAttachmentChecklistStatus } from "@/lib/checklist/checklist-repository";

describe("checklist repository", () => {
  beforeEach(() => {
    checklistDocs.clear();
    vi.clearAllMocks();
  });

  it("stores ready attachment state in firestore", async () => {
    readScholarshipQuestionById.mockResolvedValue({
      id: "question-2",
      applicationId: "app-1",
      prompt: "Upload your transcript.",
      type: "attachment",
      orderIndex: 1,
    });

    await expect(
      setAttachmentChecklistStatus("user-1", "question-2", true),
    ).resolves.toEqual({
      questionId: "question-2",
      status: "ready",
    });

    expect(checklistDocs.get("question-2")).toEqual(
      expect.objectContaining({
        userId: "user-1",
        applicationId: "app-1",
        status: "ready",
      }),
    );
  });

  it("removes checklist state when an attachment is marked missing again", async () => {
    readScholarshipQuestionById.mockResolvedValue({
      id: "question-2",
      applicationId: "app-1",
      prompt: "Upload your transcript.",
      type: "attachment",
      orderIndex: 1,
    });
    checklistDocs.set("question-2", {
      userId: "user-1",
      applicationId: "app-1",
      status: "ready",
    });

    await setAttachmentChecklistStatus("user-1", "question-2", false);

    expect(checklistDocs.has("question-2")).toBe(false);
  });
});
