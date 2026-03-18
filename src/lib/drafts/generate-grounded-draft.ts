import type { StudentProfileInput } from "@/lib/profile/student-profile";
import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";

interface GeneratedDraft {
  content: string;
  grounding: string[];
}

function joinList(values: string[]) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function generateGroundedDraft(
  profile: StudentProfileInput,
  question: ScholarshipApplicationQuestion,
): GeneratedDraft {
  const academicInterests = profile.academicInterests ?? [];
  const signatureStories = profile.signatureStories ?? [];
  const personalThemes = profile.personalThemes ?? [];

  if (question.type === "attachment") {
    return {
      content:
        "I will prepare the required attachment for this application and make sure the submitted materials match the scholarship instructions exactly.",
      grounding: ["questionType"],
    };
  }

  const grounding: string[] = [];

  const identity = `${profile.firstName} ${profile.lastName}`.trim();
  const major = profile.intendedMajor;
  if (major) grounding.push("intendedMajor");

  const leadership = profile.leadershipRoles[0] || profile.extracurriculars[0] || "";
  if (profile.leadershipRoles.length > 0) grounding.push("leadershipRoles");
  else if (profile.extracurriculars.length > 0) grounding.push("extracurriculars");

  const service = profile.volunteerWork[0] || profile.workExperience[0] || "";
  if (profile.volunteerWork.length > 0) grounding.push("volunteerWork");
  else if (profile.workExperience.length > 0) grounding.push("workExperience");

  if (personalThemes.length > 0) grounding.push("personalThemes");
  if (profile.careerGoal) grounding.push("careerGoal");

  const intro =
    question.type === "essay"
      ? `${identity} is a ${profile.academicYear} student at ${profile.schoolName} studying ${major}.`
      : `As a ${profile.academicYear} student at ${profile.schoolName}, ${profile.firstName} is focused on ${major}.`;

  const leadershipSentence = leadership
    ? `A strong example of that commitment is ${leadership}, which helped turn academic interest into visible leadership.`
    : `That commitment shows up in consistent academic and community involvement.`;

  const serviceSentence = service
    ? `That work is reinforced by ${service}, which reflects a habit of using knowledge in ways that help other people.`
    : `That direction is reinforced by steady work toward long-term educational impact.`;

  const academicInterestSentence = academicInterests.length
    ? `The academic interests driving this path include ${joinList(academicInterests)}.`
    : "";
  if (academicInterests.length > 0) grounding.push("academicInterests");

  const themeSentence = personalThemes.length
    ? `The themes that best describe this path are ${joinList(personalThemes)}.`
    : "";

  const backgroundSentence = profile.familyBackground
    ? `${profile.familyBackground} That background continues to shape how this work matters.`
    : "";
  if (backgroundSentence) grounding.push("familyBackground");

  const signatureStorySentence = signatureStories.length
    ? `A defining story the application can build on is ${signatureStories[0]}.`
    : "";
  if (signatureStorySentence) grounding.push("signatureStories");

  const goalSentence = profile.careerGoal
    ? `The long-term goal is to ${profile.careerGoal}.`
    : "";

  const supportSentence =
    question.type === "short_answer" && profile.financialNeedContext
      ? `${profile.financialNeedContext} Additional scholarship support would create more room to focus on academic growth and service.`
      : "";
  if (supportSentence) grounding.push("financialNeedContext");

  return {
    content: [
      intro,
      leadershipSentence,
      serviceSentence,
      academicInterestSentence,
      signatureStorySentence,
      backgroundSentence,
      themeSentence,
      goalSentence,
      supportSentence,
    ]
      .filter(Boolean)
      .join(" "),
    grounding,
  };
}
