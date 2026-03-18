import { GoogleGenAI } from "@google/genai";
import {
  buildDraftConstraintInstructions,
  enforceDraftConstraints,
} from "@/lib/drafts/draft-constraints";
import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";
import { getVertexDraftRuntimeConfig } from "@/lib/vertex/config";

export type DraftRewriteAction = "shorten_to_limit";

function buildRewritePrompt(
  question: ScholarshipApplicationQuestion,
  draftContent: string,
) {
  const constraintInstructions = buildDraftConstraintInstructions(question);

  return [
    "You are revising a scholarship application response.",
    "Preserve the original facts and voice.",
    "Do not invent any new achievements, numbers, organizations, or hardships.",
    "Shorten the draft only as much as needed to fit the stated constraint.",
    ...constraintInstructions,
    "",
    `Question: ${question.prompt}`,
    "",
    "Current draft:",
    draftContent,
    "",
    "Return only the revised response text.",
  ].join("\n");
}

export async function rewriteDraftForQuestion(
  question: ScholarshipApplicationQuestion,
  draftContent: string,
  action: DraftRewriteAction,
) {
  if (action !== "shorten_to_limit") {
    return draftContent.trim();
  }

  const runtime = getVertexDraftRuntimeConfig();
  const constrainedFallback = enforceDraftConstraints(draftContent, question);

  if (!runtime) {
    return constrainedFallback;
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
      contents: buildRewritePrompt(question, draftContent),
    });

    const content = response.text?.trim();
    if (!content) {
      return constrainedFallback;
    }

    return enforceDraftConstraints(content, question);
  } catch {
    return constrainedFallback;
  }
}
