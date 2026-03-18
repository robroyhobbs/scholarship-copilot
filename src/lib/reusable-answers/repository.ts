import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { readScholarshipQuestionById } from "@/lib/scholarships/question-repository";
import type { ReusableAnswerSuggestion } from "@/lib/scholarships/application-schema";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

interface ReusableAnswerRow {
  id: string;
  source_question_id: string;
  prompt: string;
  content: string;
  grounding_keys: string[] | null;
}

interface DraftSourceRow {
  id: string;
  prompt: string;
  application_id: string;
  draft_responses:
    | Array<{
        id: string;
        content: string;
        grounding_keys: string[] | null;
      }>
    | null;
}

function getReusableAnswerCollection() {
  return getFirebaseAdminDb().collection("reusableAnswers");
}

function getDraftCollection() {
  return getFirebaseAdminDb().collection("draftResponses");
}

export async function listReusableAnswers(
  userId: string,
): Promise<ReusableAnswerSuggestion[]> {
  const snapshot = await getReusableAnswerCollection()
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((doc) => {
      const row = doc.data() as {
        questionId: string;
        prompt: string;
        content: string;
        grounding: string[];
        updatedAt?: string;
      };

      return {
        id: doc.id,
        questionId: row.questionId,
        prompt: row.prompt,
        content: row.content,
        grounding: row.grounding ?? [],
        updatedAt: row.updatedAt ?? "",
      };
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(({ updatedAt: _updatedAt, ...row }) => row);
}

export async function saveReusableAnswerFromDraft(
  userId: string,
  questionId: string,
): Promise<ReusableAnswerSuggestion> {
  const firestoreQuestion = await readScholarshipQuestionById(userId, questionId);

  if (firestoreQuestion) {
    const draftSnapshot = await getDraftCollection().doc(questionId).get();
    if (!draftSnapshot.exists) {
      throw new Error("A generated draft is required before saving to the library");
    }

    const draft = draftSnapshot.data() as {
      userId?: string;
      content?: string;
      grounding?: string[];
    };
    if (!draft || draft.userId !== userId || !draft.content) {
      throw new Error("A generated draft is required before saving to the library");
    }

    await getReusableAnswerCollection().doc(questionId).set({
      userId,
      questionId,
      applicationId: firestoreQuestion.applicationId,
      prompt: firestoreQuestion.prompt,
      content: draft.content,
      grounding: draft.grounding ?? [],
      updatedAt: new Date().toISOString(),
    });

    return {
      id: questionId,
      questionId,
      prompt: firestoreQuestion.prompt,
      content: draft.content,
      grounding: draft.grounding ?? [],
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load question draft");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("application_questions")
    .select(
      "id, prompt, application_id, draft_responses(id, content, grounding_keys)",
    )
    .eq("id", questionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error || new Error("Could not load question draft");
  }

  const row = data as DraftSourceRow;
  const draft = row.draft_responses?.[0];

  if (!draft) {
    throw new Error("A generated draft is required before saving to the library");
  }

  const { data: saved, error: saveError } = await supabase
    .from("reusable_answers")
    .upsert(
      {
        user_id: userId,
        source_question_id: questionId,
        application_id: row.application_id,
        prompt: row.prompt,
        content: draft.content,
        grounding_keys: draft.grounding_keys ?? [],
      },
      { onConflict: "source_question_id" },
    )
    .select("id, source_question_id, prompt, content, grounding_keys")
    .single();

  if (saveError || !saved) {
    throw saveError || new Error("Could not save reusable answer");
  }

  const reusableAnswer = saved as ReusableAnswerRow;
  return {
    id: reusableAnswer.id,
    questionId: reusableAnswer.source_question_id,
    prompt: reusableAnswer.prompt,
    content: reusableAnswer.content,
    grounding: reusableAnswer.grounding_keys ?? [],
  };
}
