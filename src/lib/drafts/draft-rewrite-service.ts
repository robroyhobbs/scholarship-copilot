import { GoogleGenAI } from "@google/genai";
import {
  buildDraftConstraintInstructions,
  enforceDraftConstraints,
} from "@/lib/drafts/draft-constraints";
import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";
import { getVertexDraftRuntimeConfig } from "@/lib/vertex/config";

export type DraftRewriteAction = "shorten_to_limit" | "tighten_opening" | "make_more_personal";

function buildRewritePrompt(
  question: ScholarshipApplicationQuestion,
  draftContent: string,
  action: DraftRewriteAction,
) {
  const constraintInstructions = buildDraftConstraintInstructions(question);
  const actionInstruction =
    action === "shorten_to_limit"
      ? "Shorten the draft only as much as needed to fit the stated constraint."
      : action === "tighten_opening"
        ? "Tighten the opening so the response gets to the point faster while preserving the same facts and overall meaning."
        : "Make the response feel slightly more personal and direct without inventing new details.";

  return [
    "You are revising a scholarship application response.",
    "Preserve the original facts and voice.",
    "Do not invent any new achievements, numbers, organizations, or hardships.",
    actionInstruction,
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

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function tightenOpeningFallback(draftContent: string) {
  const sentences = splitSentences(draftContent);
  if (sentences.length === 0) {
    return draftContent.trim();
  }

  let firstSentence = sentences[0] ?? "";
  const commaIndex = firstSentence.indexOf(",");
  if (commaIndex !== -1 && commaIndex < 40) {
    firstSentence = firstSentence.slice(commaIndex + 1).trim();
  } else {
    const words = firstSentence.split(/\s+/);
    if (words.length > 16) {
      firstSentence = `${words.slice(0, 16).join(" ")}.`;
    }
  }

  const rebuilt = [firstSentence, ...sentences.slice(1)].join(" ").trim();
  return rebuilt || draftContent.trim();
}

function makeMorePersonalFallback(draftContent: string) {
  const trimmed = draftContent.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^for me,\s/i.test(trimmed)) {
    return trimmed;
  }

  if (/^(i|my|me)\b/i.test(trimmed)) {
    return `For me, ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }

  return `For me, ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

function applyRewriteFallback(
  draftContent: string,
  question: ScholarshipApplicationQuestion,
  action: DraftRewriteAction,
) {
  if (action === "tighten_opening") {
    return tightenOpeningFallback(draftContent);
  }

  if (action === "make_more_personal") {
    return enforceDraftConstraints(makeMorePersonalFallback(draftContent), question);
  }

  return enforceDraftConstraints(draftContent, question);
}

export async function rewriteDraftForQuestion(
  question: ScholarshipApplicationQuestion,
  draftContent: string,
  action: DraftRewriteAction,
) {
  const runtime = getVertexDraftRuntimeConfig();
  const constrainedFallback = applyRewriteFallback(draftContent, question, action);

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
      contents: buildRewritePrompt(question, draftContent, action),
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
