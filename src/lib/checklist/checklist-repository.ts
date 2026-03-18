import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { readScholarshipQuestionById } from "@/lib/scholarships/question-repository";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

interface AttachmentQuestionRow {
  id: string;
  application_id: string;
  question_type: "essay" | "short_answer" | "attachment";
}

function getChecklistCollection() {
  return getFirebaseAdminDb().collection("submissionChecklists");
}

export async function setAttachmentChecklistStatus(
  userId: string,
  questionId: string,
  completed: boolean,
) {
  const firestoreQuestion = await readScholarshipQuestionById(userId, questionId);
  if (firestoreQuestion) {
    if (firestoreQuestion.type !== "attachment") {
      throw new Error("Only attachment questions can be updated in the checklist");
    }

    if (completed) {
      await getChecklistCollection().doc(questionId).set({
        userId,
        applicationId: firestoreQuestion.applicationId,
        questionId,
        status: "ready",
        updatedAt: new Date().toISOString(),
      });
    } else {
      await getChecklistCollection().doc(questionId).delete();
    }

    return {
      questionId,
      status: completed ? "ready" : "missing",
    };
  }

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Could not load checklist question");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("application_questions")
    .select("id, application_id, question_type")
    .eq("id", questionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error || new Error("Could not load checklist question");
  }

  const question = data as AttachmentQuestionRow;
  if (question.question_type !== "attachment") {
    throw new Error("Only attachment questions can be updated in the checklist");
  }

  if (completed) {
    const { error: saveError } = await supabase.from("submission_checklists").upsert(
      {
        user_id: userId,
        application_id: question.application_id,
        question_id: questionId,
        status: "ready",
      },
      { onConflict: "question_id" },
    );

    if (saveError) {
      throw saveError;
    }
  } else {
    const { error: deleteError } = await supabase
      .from("submission_checklists")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);

    if (deleteError) {
      throw deleteError;
    }
  }

  return {
    questionId,
    status: completed ? "ready" : "missing",
  };
}
