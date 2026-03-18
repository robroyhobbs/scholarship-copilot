import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";
import type { ExtractedScholarshipQuestion } from "@/lib/scholarships/extraction";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

interface ScholarshipQuestionDocument {
  userId: string;
  applicationId: string;
  prompt: string;
  questionType: ScholarshipApplicationQuestion["type"];
  focusArea: ScholarshipApplicationQuestion["focusArea"];
  wordLimit: number | null;
  characterLimit: number | null;
  orderIndex: number;
  followUpAnswers?: string[];
  createdAt: string;
}

export interface ScholarshipQuestionRecord {
  id: string;
  applicationId: string;
  prompt: string;
  type: ScholarshipApplicationQuestion["type"];
  focusArea: ScholarshipApplicationQuestion["focusArea"];
  wordLimit: number | null;
  characterLimit: number | null;
  orderIndex: number;
  followUpAnswers: string[];
}

function getQuestionCollection() {
  return getFirebaseAdminDb().collection("scholarshipQuestions");
}

function mapQuestionDocument(
  id: string,
  data: ScholarshipQuestionDocument,
): ScholarshipQuestionRecord {
  return {
    id,
    applicationId: data.applicationId,
    prompt: data.prompt,
    type: data.questionType,
    focusArea: data.focusArea,
    wordLimit: data.wordLimit ?? null,
    characterLimit: data.characterLimit ?? null,
    orderIndex: data.orderIndex,
    followUpAnswers: data.followUpAnswers ?? [],
  };
}

export async function readScholarshipQuestionById(
  userId: string,
  questionId: string,
) {
  const snapshot = await getQuestionCollection().doc(questionId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as ScholarshipQuestionDocument | undefined;
  if (!data || data.userId !== userId) {
    return null;
  }

  return mapQuestionDocument(snapshot.id, data);
}

export async function listScholarshipQuestionsForApplication(
  userId: string,
  applicationId: string,
) {
  const snapshot = await getQuestionCollection()
    .where("userId", "==", userId)
    .where("applicationId", "==", applicationId)
    .get();

  return snapshot.docs
    .map((doc) =>
      mapQuestionDocument(doc.id, doc.data() as ScholarshipQuestionDocument),
    )
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

export async function replaceScholarshipQuestionsForApplication(
  userId: string,
  applicationId: string,
  questions: ExtractedScholarshipQuestion[],
) {
  const existing = await getQuestionCollection()
    .where("userId", "==", userId)
    .where("applicationId", "==", applicationId)
    .get();

  await Promise.all(existing.docs.map((doc) => doc.ref.delete()));

  await Promise.all(
    questions.map((question) =>
      getQuestionCollection()
        .doc(crypto.randomUUID())
        .set({
          userId,
          applicationId,
          prompt: question.prompt,
          questionType: question.type,
          focusArea: question.focusArea,
          wordLimit: question.wordLimit,
          characterLimit: question.characterLimit,
          orderIndex: question.orderIndex,
          followUpAnswers: [],
          createdAt: new Date().toISOString(),
        } satisfies ScholarshipQuestionDocument),
    ),
  );
}

export async function updateScholarshipQuestionFollowUpAnswers(
  userId: string,
  questionId: string,
  followUpAnswers: string[],
) {
  const snapshot = await getQuestionCollection().doc(questionId).get();

  if (!snapshot.exists) {
    throw new Error("Could not load scholarship question");
  }

  const data = snapshot.data() as ScholarshipQuestionDocument | undefined;
  if (!data || data.userId !== userId) {
    throw new Error("Could not load scholarship question");
  }

  await getQuestionCollection().doc(questionId).set(
    {
      followUpAnswers,
    },
    { merge: true },
  );

  const updatedSnapshot = await getQuestionCollection().doc(questionId).get();
  return mapQuestionDocument(
    updatedSnapshot.id,
    updatedSnapshot.data() as ScholarshipQuestionDocument,
  );
}
