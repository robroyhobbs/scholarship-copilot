import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  questionDocs,
  getFirebaseAdminDb,
} = vi.hoisted(() => {
  const questionDocs = new Map<string, Record<string, unknown>>();

  function matchesFilters(
    data: Record<string, unknown>,
    filters: Array<{ field: string; value: unknown }>,
  ) {
    return filters.every((filter) => data[filter.field] === filter.value);
  }

  function createQuery(filters: Array<{ field: string; value: unknown }>) {
    return {
      where(field: string, _operator: string, value: unknown) {
        return createQuery([...filters, { field, value }]);
      },
      async get() {
        const docs = Array.from(questionDocs.entries())
          .filter(([, data]) => matchesFilters(data, filters))
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
      if (name !== "scholarshipQuestions") {
        throw new Error(`Unexpected collection ${name}`);
      }

      return {
        doc(id: string) {
          return {
            async set(data: Record<string, unknown>) {
              questionDocs.set(id, {
                ...(questionDocs.get(id) ?? {}),
                ...data,
              });
            },
            async get() {
              const data = questionDocs.get(id);
              return {
                id,
                exists: Boolean(data),
                data: () => data,
              };
            },
            async delete() {
              questionDocs.delete(id);
            },
          };
        },
        where(field: string, _operator: string, value: unknown) {
          return createQuery([{ field, value }]);
        },
      };
    },
  }));

  return {
    questionDocs,
    getFirebaseAdminDb,
  };
});

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import {
  listScholarshipQuestionsForApplication,
  readScholarshipQuestionById,
  replaceScholarshipQuestionsForApplication,
  updateScholarshipQuestionFollowUpAnswers,
} from "@/lib/scholarships/question-repository";

describe("scholarship question repository", () => {
  beforeEach(() => {
    questionDocs.clear();
    vi.clearAllMocks();
  });

  it("replaces application questions in firestore", async () => {
    await replaceScholarshipQuestionsForApplication("user-1", "app-1", [
      {
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
      },
      {
        prompt: "Upload your transcript.",
        type: "attachment",
        orderIndex: 1,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
      },
    ]);

    expect(questionDocs.size).toBe(2);
    const stored = Array.from(questionDocs.values());
    expect(stored[0]).toEqual(
      expect.objectContaining({
        userId: "user-1",
        applicationId: "app-1",
      }),
    );
  });

  it("lists application questions in order", async () => {
    questionDocs.set("question-2", {
      userId: "user-1",
      applicationId: "app-1",
      prompt: "Upload your transcript.",
      questionType: "attachment",
      focusArea: "attachment",
      wordLimit: null,
      characterLimit: null,
      orderIndex: 1,
    });
    questionDocs.set("question-1", {
      userId: "user-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      questionType: "essay",
      focusArea: "leadership_service",
      wordLimit: null,
      characterLimit: null,
      orderIndex: 0,
    });

    await expect(
      listScholarshipQuestionsForApplication("user-1", "app-1"),
    ).resolves.toEqual([
      {
        id: "question-1",
        applicationId: "app-1",
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
        orderIndex: 0,
        focusArea: "leadership_service",
        wordLimit: null,
        characterLimit: null,
        followUpAnswers: [],
      },
      {
        id: "question-2",
        applicationId: "app-1",
        prompt: "Upload your transcript.",
        type: "attachment",
        orderIndex: 1,
        focusArea: "attachment",
        wordLimit: null,
        characterLimit: null,
        followUpAnswers: [],
      },
    ]);
  });

  it("reads a single scholarship question only for the owning user", async () => {
    questionDocs.set("question-1", {
      userId: "user-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      questionType: "essay",
      focusArea: "leadership_service",
      wordLimit: null,
      characterLimit: null,
      orderIndex: 0,
    });

    await expect(readScholarshipQuestionById("user-1", "question-1")).resolves.toEqual({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      orderIndex: 0,
      focusArea: "leadership_service",
      wordLimit: null,
      characterLimit: null,
      followUpAnswers: [],
    });

    await expect(readScholarshipQuestionById("user-2", "question-1")).resolves.toBeNull();
  });

  it("updates scholarship-specific follow-up answers for a question", async () => {
    questionDocs.set("question-1", {
      userId: "user-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      questionType: "essay",
      focusArea: "leadership_service",
      wordLimit: null,
      characterLimit: null,
      orderIndex: 0,
      followUpAnswers: [],
    });

    await expect(
      updateScholarshipQuestionFollowUpAnswers("user-1", "question-1", [
        "I led our robotics intake redesign project.",
        "It improved match consistency and helped newer teammates contribute.",
      ]),
    ).resolves.toEqual({
      id: "question-1",
      applicationId: "app-1",
      prompt: "Tell us about your leadership in STEM.",
      type: "essay",
      orderIndex: 0,
      focusArea: "leadership_service",
      wordLimit: null,
      characterLimit: null,
      followUpAnswers: [
        "I led our robotics intake redesign project.",
        "It improved match consistency and helped newer teammates contribute.",
      ],
    });
  });
});
