import { z } from "zod";
import type { SubmissionChecklist } from "@/lib/checklist/submission-checklist";
import type { ScholarshipFocusArea } from "@/lib/scholarships/extraction";

export const scholarshipSourceTypes = ["paste", "asset"] as const;

export const scholarshipWorkspaceSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    sponsorName: z.string().trim().optional().default(""),
    sourceType: z.enum(scholarshipSourceTypes),
    sourceText: z.string().trim().optional().default(""),
    sourceAssetId: z.uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "paste" && !value.sourceText.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceText"],
        message: "Pasted scholarship applications require source text",
      });
    }

    if (value.sourceType === "asset" && !value.sourceAssetId) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceAssetId"],
        message: "Asset-backed scholarship applications require a source asset",
      });
    }
  });

export type ScholarshipWorkspaceInput = z.infer<typeof scholarshipWorkspaceSchema>;

export interface ScholarshipApplicationSummary {
  id: string;
  scholarshipId: string;
  title: string;
  sponsorName: string;
  sourceType: ScholarshipWorkspaceInput["sourceType"];
  status: "draft";
  extractionStatus?: "pending" | "completed" | "failed";
  deadline?: string | null;
  questionCount?: number;
  createdAt?: string;
}

export interface ReusableAnswerSuggestion {
  id: string;
  questionId: string;
  prompt: string;
  content: string;
  grounding: string[];
}

export interface ScholarshipApplicationQuestion {
  id: string;
  prompt: string;
  type: "essay" | "short_answer" | "attachment";
  orderIndex: number;
  focusArea: ScholarshipFocusArea;
  wordLimit?: number | null;
  characterLimit?: number | null;
  attachmentReady?: boolean;
  draft?: {
    id: string;
    content: string;
    grounding: string[];
  } | null;
  suggestions?: ReusableAnswerSuggestion[];
  savedToLibrary?: boolean;
  followUpQuestions?: string[];
  followUpAnswers?: string[];
}

export interface ScholarshipApplicationDetail extends ScholarshipApplicationSummary {
  questions: ScholarshipApplicationQuestion[];
  checklist: SubmissionChecklist;
}
