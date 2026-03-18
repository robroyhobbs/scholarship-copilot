import { buildApplicationExport } from "@/lib/export/application-export";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { upsertStudentProfileForUser } from "@/lib/profile/profile-repository";
import { saveReusableAnswerFromDraft } from "@/lib/reusable-answers/repository";
import {
  createScholarshipWorkspace,
  getScholarshipApplicationDetail,
  replaceApplicationQuestions,
  updateScholarshipExtraction,
} from "@/lib/scholarships/application-repository";
import { listScholarshipQuestionsForApplication } from "@/lib/scholarships/question-repository";
import { setAttachmentChecklistStatus } from "@/lib/checklist/checklist-repository";
import { saveDraftResponse } from "@/lib/drafts/draft-repository";
import { createApplicationVersionSnapshot } from "@/lib/versions/application-version-repository";
import type { ScholarshipApplicationSummary } from "@/lib/scholarships/application-schema";

const DEMO_DEADLINE = "2026-04-15";

const DEMO_SOURCE_TEXT = `Bright Futures STEM Scholarship

Deadline: April 15, 2026

Eligibility:
Applicants must be high school seniors planning to major in a STEM field.

Essay Prompt:
Tell us about a time you showed leadership in a STEM-related activity or project.

Short Answer:
Why are you pursuing a STEM degree?

Required Attachments:
Upload your transcript.`;

const DEMO_QUESTIONS = [
  {
    prompt: "Tell us about a time you showed leadership in a STEM-related activity or project.",
    type: "essay" as const,
    orderIndex: 0,
    focusArea: "leadership_service" as const,
    wordLimit: null,
    characterLimit: null,
  },
  {
    prompt: "Why are you pursuing a STEM degree?",
    type: "short_answer" as const,
    orderIndex: 1,
    focusArea: "academic_goals" as const,
    wordLimit: null,
    characterLimit: null,
  },
  {
    prompt: "Upload your transcript.",
    type: "attachment" as const,
    orderIndex: 2,
    focusArea: "attachment" as const,
    wordLimit: null,
    characterLimit: null,
  },
];

async function deleteCollectionByUser(
  collectionName: string,
  userId: string,
) {
  const snapshot = await getFirebaseAdminDb()
    .collection(collectionName)
    .where("userId", "==", userId)
    .get();

  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
}

async function clearExistingDemoState(userId: string) {
  await Promise.all([
    deleteCollectionByUser("applicationVersions", userId),
    deleteCollectionByUser("submissionChecklists", userId),
    deleteCollectionByUser("reusableAnswers", userId),
    deleteCollectionByUser("draftResponses", userId),
    deleteCollectionByUser("scholarshipQuestions", userId),
    deleteCollectionByUser("scholarshipApplications", userId),
  ]);
}

function getQuestionIdByPrompt(
  questions: Awaited<ReturnType<typeof listScholarshipQuestionsForApplication>>,
  prompt: string,
) {
  const question = questions.find((entry) => entry.prompt === prompt);

  if (!question) {
    throw new Error(`Seeded question not found for prompt: ${prompt}`);
  }

  return question.id;
}

export async function seedDemoWorkspaceForUser(
  userId: string,
  email: string | null,
): Promise<{
  applicationId: string;
  applications: ScholarshipApplicationSummary[];
}> {
  await clearExistingDemoState(userId);

  await upsertStudentProfileForUser(userId, {
    firstName: "Maya",
    lastName: "Carter",
    email: email ?? "maya.carter@example.edu",
    schoolName: "Roosevelt High School",
    academicYear: "high-school-senior",
    intendedMajor: "Biomedical Engineering",
    careerGoal: "Build affordable medical devices for rural communities",
    gpa: "3.92",
    academicInterests: [
      "Biomedical engineering",
      "Human-centered design for healthcare",
      "STEM outreach for younger students",
    ],
    extracurriculars: [
      "Robotics club captain",
      "Science Olympiad competitor",
      "Peer algebra tutor",
    ],
    leadershipRoles: [
      "Led a six-student robotics design team",
      "Organized a STEM night for middle school students",
    ],
    volunteerWork: [
      "Volunteered at a community makerspace teaching Arduino basics",
    ],
    workExperience: [
      "Weekend assistant at a family-owned pharmacy",
    ],
    awards: [
      "Regional science fair finalist",
      "AP Scholar with Distinction",
    ],
    financialNeedContext:
      "My family balances tuition planning with medical expenses for my younger brother, so scholarship support directly affects where I can enroll.",
    personalThemes: [
      "Access to healthcare",
      "Mentoring younger students",
      "Building practical tools that solve real problems",
    ],
    familyBackground:
      "I come from a bilingual family that has had to navigate healthcare barriers and cost tradeoffs firsthand, which shapes how I think about engineering and access.",
    signatureStories: [
      "Led a robotics redesign that helped the team qualify for regionals and kept younger teammates engaged.",
      "Taught Arduino basics at a community makerspace and saw younger students gain confidence in STEM.",
      "Helped my family manage my younger brother's medical appointments while staying on top of school.",
    ],
    writingPreferences:
      "Confident, specific, and grounded in real examples instead of generic inspiration language.",
    challengesAdversity:
      "I learned to manage school and caregiving responsibilities while helping with my brother's appointments and after-school routines.",
  });

  const application = await createScholarshipWorkspace(userId, {
    title: "Bright Futures STEM Scholarship",
    sponsorName: "Bright Futures Foundation",
    sourceType: "paste",
    sourceText: DEMO_SOURCE_TEXT,
  });

  await replaceApplicationQuestions(application.id, userId, DEMO_QUESTIONS);
  await updateScholarshipExtraction(application.id, DEMO_DEADLINE, "completed");

  const questions = await listScholarshipQuestionsForApplication(userId, application.id);
  const leadershipQuestionId = getQuestionIdByPrompt(
    questions,
    DEMO_QUESTIONS[0].prompt,
  );
  const stemGoalQuestionId = getQuestionIdByPrompt(
    questions,
    DEMO_QUESTIONS[1].prompt,
  );
  const transcriptQuestionId = getQuestionIdByPrompt(
    questions,
    DEMO_QUESTIONS[2].prompt,
  );

  await saveDraftResponse(userId, {
    applicationId: application.id,
    questionId: leadershipQuestionId,
    content:
      "Last fall, I captained our robotics team after two seniors graduated and left a gap in mechanical design leadership. I reorganized our build schedule, paired newer students with experienced ones, and led a redesign of our intake arm after early prototypes kept jamming. The fix improved our consistency enough to help us qualify for regionals, but the bigger result was that three younger teammates stayed involved because they felt trusted and prepared. That experience showed me that STEM leadership is not just about solving the technical problem first. It is about building a team structure that helps more people solve the problem well.",
    grounding: [
      "robotics club captain",
      "organized a STEM night for middle school students",
      "regional science fair finalist",
    ],
  });

  await saveDraftResponse(userId, {
    applicationId: application.id,
    questionId: stemGoalQuestionId,
    content:
      "I am pursuing a STEM degree because I want to design medical tools that are practical, affordable, and easier for underserved communities to access. My interest in biomedical engineering grew from seeing how much time and cost my family spends navigating routine care for my younger brother. I want the technical training to build devices that solve those real constraints, not just impressive lab problems.",
    grounding: [
      "biomedical engineering",
      "access to healthcare",
      "family medical expenses",
    ],
  });

  await setAttachmentChecklistStatus(userId, transcriptQuestionId, true);
  await saveReusableAnswerFromDraft(userId, leadershipQuestionId);

  const detail = await getScholarshipApplicationDetail(userId, application.id);
  const packet = buildApplicationExport(detail);
  await createApplicationVersionSnapshot(userId, application.id, packet);

  return {
    applicationId: application.id,
    applications: [
      {
        id: application.id,
        scholarshipId: application.scholarshipId,
        title: application.title,
        sponsorName: application.sponsorName,
        sourceType: application.sourceType,
        status: "draft",
        extractionStatus: "completed",
        deadline: DEMO_DEADLINE,
        questionCount: DEMO_QUESTIONS.length,
        createdAt: application.createdAt,
      },
    ],
  };
}
