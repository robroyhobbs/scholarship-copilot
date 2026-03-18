import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { readScholarshipQuestionById } from "@/lib/scholarships/question-repository";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

interface QuestionDraftRow {
  id: string;
  application_id: string;
  prompt: string;
  question_type: "essay" | "short_answer" | "attachment";
  focus_area?: "attachment" | "leadership_service" | "financial_need" | "academic_goals" | "career_goals" | "identity_background" | "personal_story" | "general";
  word_limit?: number | null;
  character_limit?: number | null;
  order_index: number;
}

interface DraftRow {
  id: string;
  question_id: string;
  content: string;
  grounding_keys: string[] | null;
}

function getDraftCollection() {
  return getFirebaseAdminDb().collection("draftResponses");
}

export async function getQuestionForDraft(userId: string, questionId: string) {
  const firestoreQuestion = await readScholarshipQuestionById(userId, questionId);

  if (firestoreQuestion) {
    return {
      id: firestoreQuestion.id,
      applicationId: firestoreQuestion.applicationId,
      prompt: firestoreQuestion.prompt,
      type: firestoreQuestion.type,
      focusArea: firestoreQuestion.focusArea ?? "general",
      wordLimit: firestoreQuestion.wordLimit ?? null,
      characterLimit: firestoreQuestion.characterLimit ?? null,
      orderIndex: firestoreQuestion.orderIndex,
      followUpAnswers: firestoreQuestion.followUpAnswers ?? [],
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load question");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("application_questions")
    .select("id, application_id, prompt, question_type, focus_area, word_limit, character_limit, order_index")
    .eq("id", questionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error || new Error("Could not load question");
  }

  const row = data as QuestionDraftRow;
  return {
    id: row.id,
    applicationId: row.application_id,
    prompt: row.prompt,
    type: row.question_type,
    focusArea: row.focus_area ?? "general",
    wordLimit: row.word_limit ?? null,
    characterLimit: row.character_limit ?? null,
    orderIndex: row.order_index,
    followUpAnswers: [],
  };
}

export async function readDraftResponse(userId: string, questionId: string) {
  const draftSnapshot = await getDraftCollection().doc(questionId).get();

  if (draftSnapshot.exists) {
    const draft = draftSnapshot.data() as {
      userId?: string;
      content?: string;
      grounding?: string[];
    };

    if (!draft || draft.userId !== userId || !draft.content) {
      return null;
    }

    return {
      id: draftSnapshot.id,
      questionId,
      content: draft.content,
      grounding: draft.grounding ?? [],
    };
  }

  if (!hasSupabaseAdminConfig()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("draft_responses")
    .select("id, question_id, content, grounding_keys")
    .eq("question_id", questionId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as DraftRow;
  return {
    id: row.id,
    questionId: row.question_id,
    content: row.content,
    grounding: row.grounding_keys ?? [],
  };
}

export async function saveDraftResponse(
  userId: string,
  input: {
    applicationId: string;
    questionId: string;
    content: string;
    grounding: string[];
  },
) {
  await getDraftCollection().doc(input.questionId).set({
    userId,
    applicationId: input.applicationId,
    questionId: input.questionId,
    content: input.content,
    grounding: input.grounding,
    status: "generated",
    updatedAt: new Date().toISOString(),
  });

  return {
    id: input.questionId,
    questionId: input.questionId,
    content: input.content,
    grounding: input.grounding,
  };
}
