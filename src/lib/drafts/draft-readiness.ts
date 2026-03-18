import type { StudentProfileInput } from "@/lib/profile/student-profile";
import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";

export interface DraftReadinessResult {
  ready: boolean;
  followUpQuestions: string[];
}

function includesPrompt(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function getDraftReadiness(
  profile: StudentProfileInput,
  question: ScholarshipApplicationQuestion,
): DraftReadinessResult {
  if (question.type === "attachment") {
    return {
      ready: true,
      followUpQuestions: [],
    };
  }

  const prompt = question.prompt.toLowerCase();
  const followUpQuestions: string[] = [];
  const followUpAnswerCount = (question.followUpAnswers ?? []).filter((value) =>
    value.trim().length > 0,
  ).length;

  const hasExperienceContext =
    profile.leadershipRoles.length > 0 ||
    profile.extracurriculars.length > 0 ||
    profile.volunteerWork.length > 0 ||
    profile.workExperience.length > 0 ||
    followUpAnswerCount > 0;

  if (!hasExperienceContext) {
    followUpQuestions.push(
      "What is one specific activity, project, or leadership example this answer should use?",
    );
  }

  switch (question.focusArea) {
    case "leadership_service":
      if (
        profile.leadershipRoles.length === 0 &&
        profile.volunteerWork.length === 0 &&
        followUpAnswerCount < 2
      ) {
        followUpQuestions.push("What result or impact came from that experience?");
      }
      if (
        !profile.volunteerWork.length &&
        !includesPrompt(prompt, [/community/, /service/]) &&
        followUpAnswerCount < 3
      ) {
        followUpQuestions.push(
          "Who benefited from that work, and how did it help them?",
        );
      }
      break;
    case "academic_goals":
    case "career_goals":
      if (profile.academicInterests.length === 0 && followUpAnswerCount === 0) {
        followUpQuestions.push(
          "What subject, class, project, or moment made this academic path feel real to you?",
        );
      }
      if (!profile.careerGoal.trim() && followUpAnswerCount < 2) {
        followUpQuestions.push(
          "What future role, field, or problem do you want your education to prepare you for?",
        );
      }
      break;
    case "identity_background":
      if (
        !profile.familyBackground.trim() &&
        !profile.challengesAdversity.trim() &&
        followUpAnswerCount === 0
      ) {
        followUpQuestions.push(
          "What part of your family, background, or lived experience should this answer center?",
        );
      }
      if (profile.signatureStories.length === 0 && followUpAnswerCount < 2) {
        followUpQuestions.push(
          "What is one memory or story that best shows that influence or background?",
        );
      }
      break;
    case "financial_need":
      if (!profile.financialNeedContext.trim()) {
        followUpQuestions.push(
          "What should the application know about your financial context or why scholarship support matters right now?",
        );
      }
      if (followUpAnswerCount === 0) {
        followUpQuestions.push(
          "What would this scholarship make possible for you in the next year?",
        );
      }
      break;
    case "personal_story":
      if (profile.signatureStories.length === 0 && followUpAnswerCount === 0) {
        followUpQuestions.push(
          "What is the one story, accomplishment, or turning point this answer should revolve around?",
        );
      }
      if (
        profile.personalThemes.length === 0 &&
        !profile.challengesAdversity.trim() &&
        followUpAnswerCount < 2
      ) {
        followUpQuestions.push(
          "Why does that experience matter to who you are now?",
        );
      }
      break;
    default:
      if (
        includesPrompt(prompt, [/why/, /motivat/, /goal/, /future/, /career/, /stem/]) &&
        profile.personalThemes.length === 0 &&
        !profile.challengesAdversity.trim() &&
        followUpAnswerCount === 0
      ) {
        followUpQuestions.push(
          "What personal motivation, challenge, or lived experience should this answer connect to?",
        );
      }
      if (
        includesPrompt(prompt, [/financial/, /need/, /afford/, /tuition/, /cost/]) &&
        !profile.financialNeedContext.trim()
      ) {
        followUpQuestions.push(
          "What should the application know about your financial context or why scholarship support matters right now?",
        );
      }
      break;
  }

  return {
    ready: followUpQuestions.length === 0,
    followUpQuestions,
  };
}
