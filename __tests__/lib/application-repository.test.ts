import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  workspaceDocs,
  draftDocs,
  checklistDocs,
  getFirebaseAdminDb,
  createAdminClient,
  hasSupabaseAdminConfig,
  supabaseSingle,
  assetSingle,
  readStudentAssetExtractedTextById,
  listScholarshipQuestionsForApplication,
  listReusableAnswers,
} = vi.hoisted(() => {
  const workspaceDocs = new Map<string, Record<string, unknown>>();
  const draftDocs = new Map<string, Record<string, unknown>>();
  const checklistDocs = new Map<string, Record<string, unknown>>();

  function matchesFilters(
    data: Record<string, unknown>,
    filters: Array<{ field: string; value: unknown }>,
  ) {
    return filters.every((filter) => data[filter.field] === filter.value);
  }

  function createWorkspaceQuery(filters: Array<{ field: string; value: unknown }>) {
    return {
      where(field: string, _operator: string, value: unknown) {
        return createWorkspaceQuery([...filters, { field, value }]);
      },
      async get() {
        const docs = Array.from(workspaceDocs.entries())
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
      if (name === "scholarshipApplications") {
        return {
          doc(id: string) {
            return {
              async set(data: Record<string, unknown>) {
                workspaceDocs.set(id, {
                  ...(workspaceDocs.get(id) ?? {}),
                  ...data,
                });
              },
              async get() {
                const data = workspaceDocs.get(id);
                return {
                  id,
                  exists: Boolean(data),
                  data: () => data,
                };
              },
              async update(data: Record<string, unknown>) {
                workspaceDocs.set(id, {
                  ...(workspaceDocs.get(id) ?? {}),
                  ...data,
                });
              },
            };
          },
          where(field: string, _operator: string, value: unknown) {
            return createWorkspaceQuery([{ field, value }]);
          },
        };
      }

      if (name === "draftResponses" || name === "submissionChecklists") {
        const source = name === "draftResponses" ? draftDocs : checklistDocs;
        const createQuery = (filters: Array<{ field: string; value: unknown }>) => ({
          where(field: string, _operator: string, value: unknown) {
            return createQuery([...filters, { field, value }]);
          },
          async get() {
            const docs = Array.from(source.entries())
              .filter(([, data]) => matchesFilters(data, filters))
              .map(([id, data]) => ({
                id,
                exists: true,
                data: () => data,
              }));

            return { docs };
          },
        });

        return {
          where(field: string, _operator: string, value: unknown) {
            return createQuery([{ field, value }]);
          },
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  }));

  const supabaseSingle = vi.fn();
  const supabaseEq = vi.fn(() => ({
    eq: supabaseEq,
    single: supabaseSingle,
    order: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  }));
  const supabaseSelect = vi.fn(() => ({
    eq: supabaseEq,
  }));
  const assetSingle = vi.fn();
  const assetEq = vi.fn(() => ({
    eq: assetEq,
    single: assetSingle,
  }));
  const assetSelect = vi.fn(() => ({
    eq: assetEq,
  }));

  const createAdminClient = vi.fn(() => ({
    from(table: string) {
      if (table === "scholarship_applications") {
        return {
          select: supabaseSelect,
        };
      }

      if (table === "student_assets") {
        return {
          select: assetSelect,
        };
      }

      if (table === "draft_responses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "submission_checklists") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }));

  const hasSupabaseAdminConfig = vi.fn(() => true);

  const readStudentAssetExtractedTextById = vi.fn();
  const listScholarshipQuestionsForApplication = vi.fn();
  const listReusableAnswers = vi.fn();

  return {
    workspaceDocs,
    draftDocs,
    checklistDocs,
    getFirebaseAdminDb,
    createAdminClient,
    hasSupabaseAdminConfig,
    supabaseSingle,
    assetSingle,
    readStudentAssetExtractedTextById,
    listScholarshipQuestionsForApplication,
    listReusableAnswers,
  };
});

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient,
  hasSupabaseAdminConfig,
}));

vi.mock("@/lib/assets/student-asset-repository", () => ({
  readStudentAssetExtractedTextById,
}));

vi.mock("@/lib/scholarships/question-repository", () => ({
  listScholarshipQuestionsForApplication,
  readScholarshipQuestionById: vi.fn(),
  replaceScholarshipQuestionsForApplication: vi.fn(),
}));

vi.mock("@/lib/reusable-answers/repository", () => ({
  listReusableAnswers,
}));

import {
  createScholarshipWorkspace,
  getScholarshipApplicationDetail,
  getScholarshipSourceForApplication,
  listScholarshipApplications,
  updateScholarshipExtraction,
} from "@/lib/scholarships/application-repository";

describe("application repository firestore workspace migration", () => {
  beforeEach(() => {
    workspaceDocs.clear();
    draftDocs.clear();
    checklistDocs.clear();
    vi.clearAllMocks();
    listReusableAnswers.mockResolvedValue([]);
  });

  it("creates and lists firestore-backed scholarship workspaces", async () => {
    const created = await createScholarshipWorkspace("user-1", {
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      sourceText: "Essay prompt",
    });

    expect(created.title).toBe("STEM Leaders Scholarship");
    expect(created.id).toBe(created.scholarshipId);

    const listed = await listScholarshipApplications("user-1");
    expect(listed).toHaveLength(1);
    expect(listed[0]).toEqual(
      expect.objectContaining({
        id: created.id,
        title: "STEM Leaders Scholarship",
        sponsorName: "Bright Futures Foundation",
        sourceType: "paste",
      }),
    );
  });

  it("loads scholarship source text from firestore workspaces first", async () => {
    workspaceDocs.set("app-1", {
      userId: "user-1",
      scholarshipId: "app-1",
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      sourceText: "Essay prompt from firestore",
      extractionStatus: "pending",
      status: "draft",
      createdAt: "2026-03-16T18:00:00.000Z",
    });

    await expect(
      getScholarshipSourceForApplication("user-1", "app-1"),
    ).resolves.toEqual({
      scholarshipId: "app-1",
      sourceText: "Essay prompt from firestore",
    });
  });

  it("falls back to legacy supabase asset text when firestore workspace data is missing", async () => {
    supabaseSingle.mockResolvedValue({
      data: {
        scholarship_id: "scholarship-1",
        scholarships: {
          id: "scholarship-1",
          source_text: null,
          source_asset_id: "asset-1",
        },
      },
      error: null,
    });
    readStudentAssetExtractedTextById.mockResolvedValue(null);
    assetSingle.mockResolvedValue({
      data: {
        extracted_text: "Supabase asset text",
      },
      error: null,
    });

    await expect(
      getScholarshipSourceForApplication("user-1", "legacy-app"),
    ).resolves.toEqual({
      scholarshipId: "scholarship-1",
      sourceText: "Supabase asset text",
    });
  });

  it("builds application detail from firestore workspace and question data", async () => {
    workspaceDocs.set("app-1", {
      userId: "user-1",
      scholarshipId: "app-1",
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      sourceType: "paste",
      extractionStatus: "completed",
      extractedDeadline: "2026-04-15",
      status: "draft",
      createdAt: "2026-03-16T18:00:00.000Z",
    });
    listScholarshipQuestionsForApplication.mockResolvedValue([
      {
        id: "question-1",
        applicationId: "app-1",
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
        orderIndex: 0,
      },
    ]);

    const detail = await getScholarshipApplicationDetail("user-1", "app-1");

    expect(detail.id).toBe("app-1");
    expect(detail.questionCount).toBe(1);
    expect(detail.questions[0]).toEqual(
      expect.objectContaining({
        id: "question-1",
        prompt: "Tell us about your leadership in STEM.",
        type: "essay",
      }),
    );
  });

  it("updates extraction state on firestore workspaces", async () => {
    workspaceDocs.set("app-1", {
      userId: "user-1",
      scholarshipId: "app-1",
      title: "Scholarship",
      status: "draft",
      extractionStatus: "pending",
      createdAt: "2026-03-16T18:00:00.000Z",
    });

    await updateScholarshipExtraction("app-1", "2026-04-15", "completed");

    expect(workspaceDocs.get("app-1")).toEqual(
      expect.objectContaining({
        extractionStatus: "completed",
        extractedDeadline: "2026-04-15",
      }),
    );
  });
});
