import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { readScholarshipQuestionById } from "@/lib/scholarships/question-repository";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

interface QuestionDraftRow {
  id: string;
  application_id: string;
  prompt: string;
  question_type: "essay" | "short_answer" | "attachment";
  focus_area?: "attachment" | "leadership_service" | "financial_need" | "academic_goals" | "career_goals" | "identity_background" | "personal_story" | "general";
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
      focusArea: firestoreQuestion.focusArea,
      orderIndex: firestoreQuestion.orderIndex,
      followUpAnswers: firestoreQuestion.followUpAnswers,
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load question");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("application_questions")
    .select("id, application_id, prompt, question_type, focus_area, order_index")
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
    orderIndex: row.order_index,
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
