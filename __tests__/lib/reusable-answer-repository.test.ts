import { beforeEach, describe, expect, it, vi } from "vitest";

const { readScholarshipQuestionById } = vi.hoisted(() => ({
  readScholarshipQuestionById: vi.fn(),
}));

const { draftDocs, answerDocs, getFirebaseAdminDb } = vi.hoisted(() => {
  const draftDocs = new Map<string, Record<string, unknown>>();
  const answerDocs = new Map<string, Record<string, unknown>>();

  function createQuery(
    source: Map<string, Record<string, unknown>>,
    filters: Array<{ field: string; value: unknown }>,
  ) {
    return {
      where(field: string, _operator: string, value: unknown) {
        return createQuery(source, [...filters, { field, value }]);
      },
      async get() {
        const docs = Array.from(source.entries())
          .filter(([, data]) =>
            filters.every((filter) => data[filter.field] === filter.value),
          )
          .map(([id, data]) => ({
            id,
            exists: true,
            data: () => data,
          }));

        return { docs };
      },
    };
  }

  const getFirebaseAdminDb = vi.fn(() => ({
    collection(name: string) {
      if (name === "draftResponses") {
        return {
          doc(id: string) {
            return {
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
      }

      if (name === "reusableAnswers") {
        return {
          doc(id: string) {
            return {
              async set(data: Record<string, unknown>) {
                answerDocs.set(id, {
                  ...(answerDocs.get(id) ?? {}),
                  ...data,
                });
              },
            };
          },
          where(field: string, _operator: string, value: unknown) {
            return createQuery(answerDocs, [{ field, value }]);
          },
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  }));

  return {
    draftDocs,
    answerDocs,
    getFirebaseAdminDb,
  };
});

vi.mock("@/lib/scholarships/question-repository", () => ({
  readScholarshipQuestionById,
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import {
  listReusableAnswers,
  saveReusableAnswerFromDraft,
} from "@/lib/reusable-answers/repository";

describe("reusable answer repository", () => {
  beforeEach(() => {
    draftDocs.clear();
    answerDocs.clear();
    vi.clearAllMocks();
  });

  it("saves reusable answers from firestore-backed drafts", async () => {
    readScholarshipQuestionById.mockResolvedValue({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      orderIndex: 0,
    });
    draftDocs.set("question-1", {
      userId: "user-1",
      applicationId: "app-1",
      questionId: "question-1",
      content: "Generated draft content",
      grounding: ["leadershipRoles"],
    });

    await expect(
      saveReusableAnswerFromDraft("user-1", "question-1"),
    ).resolves.toEqual({
      id: "question-1",
      questionId: "question-1",
      prompt: "Tell us about your leadership in STEM.",
      content: "Generated draft content",
      grounding: ["leadershipRoles"],
    });
  });

  it("lists reusable answers from firestore", async () => {
    answerDocs.set("question-1", {
      userId: "user-1",
      questionId: "question-1",
      prompt: "Tell us about your leadership in STEM.",
      content: "Generated draft content",
      grounding: ["leadershipRoles"],
      updatedAt: "2026-03-16T20:00:00.000Z",
    });

    await expect(listReusableAnswers("user-1")).resolves.toEqual([
      {
        id: "question-1",
        questionId: "question-1",
        prompt: "Tell us about your leadership in STEM.",
        content: "Generated draft content",
        grounding: ["leadershipRoles"],
      },
    ]);
  });
});
