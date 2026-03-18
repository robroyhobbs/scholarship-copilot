import type { ScholarshipApplicationDetail } from "@/lib/scholarships/application-schema";
import { redactPrivacySensitiveContent } from "@/lib/privacy/privacy-redact";
import { detectPrivacyWarnings } from "@/lib/privacy/privacy-review";

export interface ApplicationExportSection {
  questionId: string;
  kind: "response" | "attachment";
  heading: string;
  body: string;
  redactedBody: string;
}

export interface ApplicationExportPacket {
  title: string;
  sponsorName: string;
  deadline: string | null | undefined;
  readyToSubmit: boolean;
  missingItems: string[];
  privacyWarnings: string[];
  sections: ApplicationExportSection[];
}

export function buildApplicationExport(
  application: ScholarshipApplicationDetail,
): ApplicationExportPacket {
  const sections = application.questions.flatMap<ApplicationExportSection>((question) => {
    if (question.type === "attachment") {
      if (!question.attachmentReady) {
        return [];
      }

      return [
        {
          questionId: question.id,
          kind: "attachment",
          heading: question.prompt,
          body: "Attachment marked ready by student.",
          redactedBody: "Attachment marked ready by student.",
        },
      ];
    }

    if (!question.draft) {
      return [];
    }

    return [
      {
        questionId: question.id,
        kind: "response",
        heading: question.prompt,
        body: question.draft.content,
        redactedBody: redactPrivacySensitiveContent(question.draft.content),
      },
    ];
  });
  const privacyWarnings = Array.from(
    new Set(sections.flatMap((section) => detectPrivacyWarnings(section.body))),
  );

  return {
    title: application.title,
    sponsorName: application.sponsorName,
    deadline: application.deadline,
    readyToSubmit:
      application.checklist.totalItems > 0 &&
      application.checklist.completedItems === application.checklist.totalItems &&
      privacyWarnings.length === 0,
    missingItems: [
      ...application.checklist.missingAttachmentPrompts,
      ...(application.checklist.missingResponsePrompts ?? []),
      ...(application.checklist.revisionRequiredPrompts ?? []),
    ],
    privacyWarnings,
    sections,
  };
}
