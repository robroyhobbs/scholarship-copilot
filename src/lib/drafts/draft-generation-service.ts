import { GoogleGenAI } from "@google/genai";
import {
  buildDraftConstraintInstructions,
  enforceDraftConstraints,
} from "@/lib/drafts/draft-constraints";
import type { StudentProfileInput } from "@/lib/profile/student-profile";
import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";
import { generateGroundedDraft } from "@/lib/drafts/generate-grounded-draft";
import { getVertexDraftRuntimeConfig } from "@/lib/vertex/config";

type DraftGenerationResult = ReturnType<typeof generateGroundedDraft>;

function formatList(label: string, values: string[]) {
  if (!values || values.length === 0) {
    return `${label}: none provided`;
  }

  return `${label}: ${values.join("; ")}`;
}

function buildDraftPrompt(
  profile: StudentProfileInput,
  question: ScholarshipApplicationQuestion,
  fallback: DraftGenerationResult,
) {
  const focusArea = question.focusArea ?? "general";
  const constraintInstructions = buildDraftConstraintInstructions(question);

  return [
    "You are writing a scholarship application response for a student.",
    "Use only the verified profile facts below.",
    "Do not invent achievements, numbers, dates, organizations, or hardships that are not explicitly provided.",
    "If the profile is missing a detail, stay general instead of making one up.",
    "Write in first person as the student.",
    question.type === "short_answer"
      ? "Keep the response concise and direct."
      : "Write a polished scholarship-ready paragraph.",
    ...constraintInstructions,
    `Primary focus area: ${focusArea.replaceAll("_", " ")}`,
    "",
    `Question: ${question.prompt}`,
    "",
    "Verified student profile:",
    `Name: ${profile.firstName} ${profile.lastName}`.trim(),
    `School: ${profile.schoolName || "not provided"}`,
    `Academic year: ${profile.academicYear}`,
    `Intended major: ${profile.intendedMajor || "not provided"}`,
    `Career goal: ${profile.careerGoal || "not provided"}`,
    `GPA: ${profile.gpa || "not provided"}`,
    formatList("Academic interests", profile.academicInterests),
    formatList("Extracurriculars", profile.extracurriculars),
    formatList("Leadership roles", profile.leadershipRoles),
    formatList("Volunteer work", profile.volunteerWork),
    formatList("Work experience", profile.workExperience),
    formatList("Awards", profile.awards),
    formatList("Personal themes", profile.personalThemes),
    formatList("Signature stories", profile.signatureStories),
    `Family or background context: ${profile.familyBackground || "not provided"}`,
    `Financial need context: ${profile.financialNeedContext || "not provided"}`,
    `Challenges or adversity: ${profile.challengesAdversity || "not provided"}`,
    `Writing preferences: ${profile.writingPreferences || "not provided"}`,
    "",
    "Facts already identified as relevant:",
    fallback.content,
    "",
    "Return only the final response text.",
  ].join("\n");
}

export async function generateDraftForQuestion(
  profile: StudentProfileInput,
  question: ScholarshipApplicationQuestion,
): Promise<DraftGenerationResult> {
  const fallback = generateGroundedDraft(profile, question);
  const followUpDetails = (question.followUpAnswers ?? []).filter((value) =>
    value.trim().length > 0,
  );
  const fallbackWithContext =
    followUpDetails.length > 0
      ? {
          content: enforceDraftConstraints(
            `${fallback.content} ${followUpDetails.join(" ")}`.trim(),
            question,
          ),
          grounding: Array.from(
            new Set([...fallback.grounding, "applicationFollowUpAnswers"]),
          ),
        }
      : {
          ...fallback,
          content: enforceDraftConstraints(fallback.content, question),
        };

  if (question.type === "attachment") {
    return fallbackWithContext;
  }

  const runtime = getVertexDraftRuntimeConfig();

  if (!runtime) {
    return fallbackWithContext;
  }

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: runtime.project,
      location: runtime.location,
      apiVersion: "v1",
    });

    const response = await ai.models.generateContent({
      model: runtime.model,
      contents: buildDraftPrompt(profile, question, fallbackWithContext),
    });

    const content = response.text?.trim();

    if (!content) {
      return fallbackWithContext;
    }

    return {
      content: enforceDraftConstraints(content, question),
      grounding: fallbackWithContext.grounding,
    };
  } catch {
    return fallbackWithContext;
  }
}
