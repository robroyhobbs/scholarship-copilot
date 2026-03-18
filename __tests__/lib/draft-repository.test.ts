import { beforeEach, describe, expect, it, vi } from "vitest";

const { readScholarshipQuestionById } = vi.hoisted(() => ({
  readScholarshipQuestionById: vi.fn(),
}));

const { draftDocs, getFirebaseAdminDb } = vi.hoisted(() => {
  const draftDocs = new Map<string, Record<string, unknown>>();

  const getFirebaseAdminDb = vi.fn(() => ({
    collection(name: string) {
      if (name !== "draftResponses") {
        throw new Error(`Unexpected collection ${name}`);
      }

      return {
        doc(id: string) {
          return {
            async set(data: Record<string, unknown>) {
              draftDocs.set(id, {
                ...(draftDocs.get(id) ?? {}),
                ...data,
              });
            },
            async get() {
              const data = draftDocs.get(id);
              return {
                id,
                exists: Boolean(data),
                data: () => data,
              };
            },
          };
        },
      };
    },
  }));

  return {
    draftDocs,
    getFirebaseAdminDb,
  };
});

vi.mock("@/lib/scholarships/question-repository", () => ({
  readScholarshipQuestionById,
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import { getQuestionForDraft, saveDraftResponse } from "@/lib/drafts/draft-repository";

describe("draft repository", () => {
  beforeEach(() => {
    draftDocs.clear();
    vi.clearAllMocks();
  });

  it("uses firestore question metadata for draft generation", async () => {
    readScholarshipQuestionById.mockResolvedValue({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      orderIndex: 0,
    });

    await expect(getQuestionForDraft("user-1", "question-1")).resolves.toEqual({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      orderIndex: 0,
    });
  });

  it("stores draft responses in firestore", async () => {
    await expect(
      saveDraftResponse("user-1", {
        applicationId: "app-1",
        questionId: "question-1",
        content: "Generated draft content",
        grounding: ["leadershipRoles"],
      }),
    ).resolves.toEqual({
      id: "question-1",
      questionId: "question-1",
      content: "Generated draft content",
      grounding: ["leadershipRoles"],
    });

    expect(draftDocs.get("question-1")).toEqual(
      expect.objectContaining({
        userId: "user-1",
        applicationId: "app-1",
        questionId: "question-1",
        content: "Generated draft content",
      }),
    );
  });
});
