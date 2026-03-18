import { readStudentAssetExtractedTextById } from "@/lib/assets/student-asset-repository";
import { buildSubmissionChecklist } from "@/lib/checklist/submission-checklist";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { findReusableAnswerSuggestions } from "@/lib/reusable-answers/matching";
import { listReusableAnswers } from "@/lib/reusable-answers/repository";
import type {
  ReusableAnswerSuggestion,
  ScholarshipApplicationDetail,
  ScholarshipApplicationQuestion,
  ScholarshipApplicationSummary,
  ScholarshipWorkspaceInput,
} from "@/lib/scholarships/application-schema";
import type { ExtractedScholarshipQuestion } from "@/lib/scholarships/extraction";
import {
  listScholarshipQuestionsForApplication,
  replaceScholarshipQuestionsForApplication,
} from "@/lib/scholarships/question-repository";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

interface FirestoreScholarshipApplicationDocument {
  userId: string;
  scholarshipId: string;
  title: string;
  sponsorName: string;
  sourceType: "paste" | "asset";
  sourceText: string;
  sourceAssetId: string;
  extractionStatus: "pending" | "completed" | "failed";
  extractedDeadline: string | null;
  status: "draft";
  createdAt: string;
  updatedAt: string;
}

interface ScholarshipRow {
  id: string;
  title: string;
  sponsor_name: string | null;
  source_type: "paste" | "asset";
  extraction_status?: "pending" | "completed" | "failed";
  extracted_deadline?: string | null;
}

interface ScholarshipApplicationRow {
  id: string;
  scholarship_id: string;
  status: "draft";
  created_at: string;
  scholarships: ScholarshipRow | ScholarshipRow[];
}

interface ScholarshipSourceRow {
  scholarship_id: string;
  scholarships:
    | {
        id: string;
        source_text: string | null;
        source_asset_id: string | null;
      }
    | Array<{
        id: string;
        source_text: string | null;
        source_asset_id: string | null;
      }>;
}

interface QuestionRow {
  id: string;
  prompt: string;
  question_type: "essay" | "short_answer" | "attachment";
  focusArea?: ScholarshipApplicationQuestion["focusArea"];
  focus_area?: ScholarshipApplicationQuestion["focusArea"];
  wordLimit?: number | null;
  word_limit?: number | null;
  characterLimit?: number | null;
  character_limit?: number | null;
  order_index: number;
  followUpAnswers?: string[];
  submission_checklists:
    | Array<{
        status: "ready";
      }>
    | null;
  draft_responses:
    | Array<{
        id: string;
        content: string;
        grounding_keys: string[] | null;
      }>
    | null;
}

interface ScholarshipApplicationDetailRow {
  id: string;
  scholarship_id: string;
  status: "draft";
  created_at: string;
  scholarships: ScholarshipRow | ScholarshipRow[];
  application_questions: QuestionRow[] | null;
}

function getWorkspaceCollection() {
  return getFirebaseAdminDb().collection("scholarshipApplications");
}

function normalizeScholarship(
  row: ScholarshipApplicationRow,
): ScholarshipApplicationSummary {
  const scholarship = Array.isArray(row.scholarships)
    ? row.scholarships[0]
    : row.scholarships;

  return {
    id: row.id,
    scholarshipId: row.scholarship_id,
    title: scholarship.title,
    sponsorName: scholarship.sponsor_name ?? "",
    sourceType: scholarship.source_type,
    status: row.status,
    extractionStatus: scholarship.extraction_status,
    deadline: scholarship.extracted_deadline ?? null,
    createdAt: row.created_at,
  };
}

function normalizeFirestoreWorkspace(
  id: string,
  data: FirestoreScholarshipApplicationDocument,
): ScholarshipApplicationSummary {
  return {
    id,
    scholarshipId: data.scholarshipId,
    title: data.title,
    sponsorName: data.sponsorName,
    sourceType: data.sourceType,
    status: data.status,
    extractionStatus: data.extractionStatus,
    deadline: data.extractedDeadline,
    createdAt: data.createdAt,
  };
}

async function listLegacyScholarshipApplications(userId: string) {
  if (!hasSupabaseAdminConfig()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scholarship_applications")
    .select(
      "id, scholarship_id, status, created_at, scholarships(id, title, sponsor_name, source_type)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ScholarshipApplicationRow[]).map(normalizeScholarship);
}

async function readFirestoreWorkspaceById(userId: string, applicationId: string) {
  const snapshot = await getWorkspaceCollection().doc(applicationId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as FirestoreScholarshipApplicationDocument | undefined;
  if (!data || data.userId !== userId) {
    return null;
  }

  return {
    id: snapshot.id,
    data,
  };
}

function normalizeQuestions(
  questions: QuestionRow[] | null | undefined,
  reusableAnswers: ReusableAnswerSuggestion[],
): ScholarshipApplicationQuestion[] {
  return (questions ?? [])
    .slice()
    .sort((left, right) => left.order_index - right.order_index)
    .map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.question_type,
      focusArea: question.focusArea ?? question.focus_area ?? "general",
      wordLimit: question.wordLimit ?? question.word_limit ?? null,
      characterLimit:
        question.characterLimit ?? question.character_limit ?? null,
      orderIndex: question.order_index,
      attachmentReady: question.submission_checklists?.[0]?.status === "ready",
      draft: question.draft_responses?.[0]
        ? {
            id: question.draft_responses[0].id,
            content: question.draft_responses[0].content,
            grounding: question.draft_responses[0].grounding_keys ?? [],
          }
        : null,
      suggestions: findReusableAnswerSuggestions(question.prompt, reusableAnswers),
      followUpAnswers: question.followUpAnswers ?? [],
    }));
}

export async function listScholarshipApplications(userId: string) {
  const firestoreSnapshot = await getWorkspaceCollection()
    .where("userId", "==", userId)
    .get();
  const firestoreApplications = firestoreSnapshot.docs.map((doc) =>
    normalizeFirestoreWorkspace(
      doc.id,
      doc.data() as FirestoreScholarshipApplicationDocument,
    ),
  );
  const legacyApplications = await listLegacyScholarshipApplications(userId);
  const merged = new Map<string, ScholarshipApplicationSummary>();

  for (const application of [...legacyApplications, ...firestoreApplications]) {
    merged.set(application.id, application);
  }

  return Array.from(merged.values()).sort((left, right) =>
    (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
  );
}

export async function createScholarshipWorkspace(
  userId: string,
  input: ScholarshipWorkspaceInput,
) {
  const applicationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await getWorkspaceCollection().doc(applicationId).set({
    userId,
    scholarshipId: applicationId,
    title: input.title,
    sponsorName: input.sponsorName || "",
    sourceType: input.sourceType,
    sourceText: input.sourceText || "",
    sourceAssetId: input.sourceAssetId ?? "",
    extractionStatus: "pending",
    extractedDeadline: null,
    status: "draft",
    createdAt,
    updatedAt: createdAt,
  } satisfies FirestoreScholarshipApplicationDocument);

  return {
    id: applicationId,
    scholarshipId: applicationId,
    title: input.title,
    sponsorName: input.sponsorName || "",
    sourceType: input.sourceType,
    status: "draft",
    extractionStatus: "pending",
    deadline: null,
    createdAt,
  };
}

export async function getScholarshipSourceForApplication(
  userId: string,
  applicationId: string,
) {
  const firestoreWorkspace = await readFirestoreWorkspaceById(userId, applicationId);

  if (firestoreWorkspace) {
    let sourceText = firestoreWorkspace.data.sourceText ?? "";

    if (!sourceText && firestoreWorkspace.data.sourceAssetId) {
      sourceText =
        (await readStudentAssetExtractedTextById(
          userId,
          firestoreWorkspace.data.sourceAssetId,
        )) ?? "";
    }

    return {
      scholarshipId: firestoreWorkspace.data.scholarshipId,
      sourceText,
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load scholarship source");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scholarship_applications")
    .select("scholarship_id, scholarships(id, source_text, source_asset_id)")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error || new Error("Could not load scholarship source");
  }

  const row = data as ScholarshipSourceRow;
  const scholarship = Array.isArray(row.scholarships)
    ? row.scholarships[0]
    : row.scholarships;

  let sourceText = scholarship.source_text ?? "";

  if (!sourceText && scholarship.source_asset_id) {
    sourceText =
      (await readStudentAssetExtractedTextById(
        userId,
        scholarship.source_asset_id,
      )) ?? "";
  }

  if (!sourceText && scholarship.source_asset_id) {
    const { data: asset, error: assetError } = await supabase
      .from("student_assets")
      .select("extracted_text")
      .eq("id", scholarship.source_asset_id)
      .eq("user_id", userId)
      .single();

    if (assetError) {
      throw assetError;
    }

    sourceText = asset?.extracted_text ?? "";
  }

  return {
    scholarshipId: scholarship.id,
    sourceText,
  };
}

export async function replaceApplicationQuestions(
  applicationId: string,
  userId: string,
  questions: ExtractedScholarshipQuestion[],
) {
  const firestoreWorkspace = await readFirestoreWorkspaceById(userId, applicationId);

  if (firestoreWorkspace) {
    await replaceScholarshipQuestionsForApplication(userId, applicationId, questions);
    return;
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not replace application questions");
  }

  const supabase = createAdminClient();

  await supabase
    .from("application_questions")
    .delete()
    .eq("application_id", applicationId)
    .eq("user_id", userId);

  if (questions.length === 0) {
    return;
  }

  const { error } = await supabase.from("application_questions").insert(
    questions.map((question) => ({
      application_id: applicationId,
      user_id: userId,
      prompt: question.prompt,
      question_type: question.type,
      focus_area: question.focusArea,
      word_limit: question.wordLimit,
      character_limit: question.characterLimit,
      order_index: question.orderIndex,
    })),
  );

  if (error) {
    throw error;
  }
}

export async function updateScholarshipExtraction(
  scholarshipId: string,
  deadline: string | null,
  status: "pending" | "completed" | "failed",
) {
  const firestoreWorkspace = await getWorkspaceCollection().doc(scholarshipId).get();

  if (firestoreWorkspace.exists) {
    await getWorkspaceCollection().doc(scholarshipId).update({
      extractionStatus: status,
      extractedDeadline: deadline,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not update scholarship extraction");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("scholarships")
    .update({
      extracted_deadline: deadline,
      extraction_status: status,
    })
    .eq("id", scholarshipId);

  if (error) {
    throw error;
  }
}

export async function getScholarshipApplicationDetail(
  userId: string,
  applicationId: string,
): Promise<ScholarshipApplicationDetail> {
  const firestoreWorkspace = await readFirestoreWorkspaceById(userId, applicationId);

  if (firestoreWorkspace) {
    const db = getFirebaseAdminDb();
    const [questionRecords, reusableAnswers, draftSnapshot, checklistSnapshot] =
      await Promise.all([
        listScholarshipQuestionsForApplication(userId, applicationId),
        listReusableAnswers(userId),
        db.collection("draftResponses")
          .where("userId", "==", userId)
          .where("applicationId", "==", applicationId)
          .get(),
        db.collection("submissionChecklists")
          .where("userId", "==", userId)
          .where("applicationId", "==", applicationId)
          .get(),
      ]);

    const draftMap = new Map<
      string,
      { id: string; content: string; grounding_keys: string[] | null }
    >();
    for (const draft of draftSnapshot.docs) {
      const data = draft.data() as {
        questionId: string;
        content: string;
        grounding?: string[];
      };
      if (!draftMap.has(data.questionId)) {
        draftMap.set(data.questionId, {
          id: draft.id,
          content: data.content,
          grounding_keys: data.grounding ?? [],
        });
      }
    }

    const checklistMap = new Map<string, "ready">();
    for (const item of checklistSnapshot.docs) {
      const data = item.data() as {
        questionId: string;
        status: "ready";
      };
      checklistMap.set(data.questionId, data.status);
    }

    const questions = normalizeQuestions(
      questionRecords.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        question_type: question.type,
        focusArea: question.focusArea,
        wordLimit: question.wordLimit,
        characterLimit: question.characterLimit,
        order_index: question.orderIndex,
        followUpAnswers: question.followUpAnswers,
        submission_checklists: checklistMap.has(question.id)
          ? [{ status: "ready" as const }]
          : null,
        draft_responses: draftMap.has(question.id)
          ? [draftMap.get(question.id)!]
          : null,
      })),
      reusableAnswers,
    );

    return {
      ...normalizeFirestoreWorkspace(
        firestoreWorkspace.id,
        firestoreWorkspace.data,
      ),
      questions,
      checklist: buildSubmissionChecklist(questions),
      questionCount: questions.length,
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load application detail");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scholarship_applications")
    .select(
      "id, scholarship_id, status, created_at, scholarships(id, title, sponsor_name, source_type, extraction_status, extracted_deadline), application_questions(id, prompt, question_type, focus_area, word_limit, character_limit, order_index, submission_checklists(status), draft_responses(id, content, grounding_keys))",
    )
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error || new Error("Could not load application detail");
  }

  const row = data as ScholarshipApplicationDetailRow;
  const reusableAnswers = await listReusableAnswers(userId);
  const questions = normalizeQuestions(row.application_questions, reusableAnswers);

  return {
    ...normalizeScholarship(row),
    questions,
    checklist: buildSubmissionChecklist(questions),
    questionCount: row.application_questions?.length ?? 0,
  };
}
