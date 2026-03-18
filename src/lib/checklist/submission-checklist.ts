import type { ScholarshipApplicationQuestion } from "@/lib/scholarships/application-schema";

export interface SubmissionChecklistItem {
  questionId: string;
  prompt: string;
  kind: "response" | "attachment";
  status: "complete" | "missing" | "needs_revision";
  note?: string;
}

export interface SubmissionChecklist {
  totalItems: number;
  completedItems: number;
  items: SubmissionChecklistItem[];
  missingAttachmentPrompts: string[];
  missingResponsePrompts?: string[];
  revisionRequiredPrompts?: string[];
}

function countWords(content: string) {
  return content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildRevisionNote(question: ScholarshipApplicationQuestion, draftContent: string) {
  if (question.wordLimit && countWords(draftContent) > question.wordLimit) {
    return `Draft is above the ${question.wordLimit}-word limit.`;
  }

  if (
    question.characterLimit &&
    draftContent.trim().length > question.characterLimit
  ) {
    return `Draft is above the ${question.characterLimit}-character limit.`;
  }

  return null;
}

export function buildSubmissionChecklist(
  questions: ScholarshipApplicationQuestion[],
): SubmissionChecklist {
  const items = questions.map<SubmissionChecklistItem>((question) => {
    if (question.type === "attachment") {
      return {
        questionId: question.id,
        prompt: question.prompt,
        kind: "attachment",
        status: question.attachmentReady ? "complete" : "missing",
      };
    }

    const draftContent = question.draft?.content ?? "";
    const revisionNote = question.draft
      ? buildRevisionNote(question, draftContent)
      : null;

    return {
      questionId: question.id,
      prompt: question.prompt,
      kind: "response",
      status: !question.draft
        ? "missing"
        : revisionNote
          ? "needs_revision"
          : "complete",
      note: revisionNote ?? undefined,
    };
  });

  return {
    totalItems: items.length,
    completedItems: items.filter((item) => item.status === "complete").length,
    missingResponsePrompts: items
      .filter((item) => item.kind === "response" && item.status === "missing")
      .map((item) => item.prompt),
    missingAttachmentPrompts: items
      .filter((item) => item.kind === "attachment" && item.status === "missing")
      .map((item) => item.prompt),
    revisionRequiredPrompts: items
      .filter((item) => item.status === "needs_revision")
      .map((item) => item.prompt),
    items,
  };
}
