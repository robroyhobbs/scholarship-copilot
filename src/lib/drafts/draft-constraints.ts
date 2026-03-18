import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";

export function countWords(content: string) {
  return content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function buildDraftConstraintInstructions(
  question: ScholarshipApplicationQuestion,
) {
  const instructions: string[] = [];

  if (question.wordLimit) {
    instructions.push(`Stay within ${question.wordLimit} words.`);
  }

  if (question.characterLimit) {
    instructions.push(`Stay within ${question.characterLimit} characters.`);
  }

  return instructions;
}

export function formatDraftConstraintLabel(
  question: ScholarshipApplicationQuestion,
) {
  if (question.wordLimit && question.characterLimit) {
    return `Target: ${question.wordLimit} words max, ${question.characterLimit} characters max`;
  }

  if (question.wordLimit) {
    return `Target: ${question.wordLimit} words max`;
  }

  if (question.characterLimit) {
    return `Target: ${question.characterLimit} characters max`;
  }

  return null;
}

export function enforceDraftConstraints(
  content: string,
  question: ScholarshipApplicationQuestion,
) {
  let constrained = content.trim().replace(/\s+/g, " ");

  if (question.wordLimit) {
    const words = constrained.split(/\s+/).filter(Boolean);
    if (words.length > question.wordLimit) {
      constrained = words.slice(0, question.wordLimit).join(" ");
    }
  }

  if (question.characterLimit && constrained.length > question.characterLimit) {
    const sliced = constrained.slice(0, question.characterLimit).trim();
    const safeSlice =
      sliced.length < constrained.length && sliced.includes(" ")
        ? sliced.slice(0, sliced.lastIndexOf(" "))
        : sliced;

    constrained = safeSlice.trim().replace(/[,:;]+$/, "");
  }

  return constrained;
}
