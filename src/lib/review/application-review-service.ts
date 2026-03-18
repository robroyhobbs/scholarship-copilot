import { GoogleGenAI } from "@google/genai";
import type { ApplicationExportPacket } from "@/lib/export/application-export";
import { getVertexReviewRuntimeConfig } from "@/lib/vertex/config";

export interface ApplicationReviewResult {
  summary: string;
  strengths: string[];
  risks: string[];
  revisionPriorities: string[];
  model: string;
}

function safeArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : [];
}

function parseJsonResponse(text: string) {
  const trimmed = text.trim();
  const normalized = trimmed.startsWith("```")
    ? trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(normalized) as {
    summary?: string;
    strengths?: unknown;
    risks?: unknown;
    revisionPriorities?: unknown;
  };
}

function buildFallbackReview(packet: ApplicationExportPacket): ApplicationReviewResult {
  const strengths = [];
  const responseCount = packet.sections.filter((section) => section.kind === "response").length;

  if (responseCount > 0) {
    strengths.push("You have written submission-ready response content for this packet.");
  }

  if (packet.sections.some((section) => section.kind === "attachment")) {
    strengths.push("At least one required attachment has already been marked ready.");
  }

  const risks = [
    ...packet.missingItems.map(
      (item) => `Upload the remaining required attachment before submission.`,
    ),
    ...packet.privacyWarnings.map(
      () => "Remove or redact private contact details before copying the final packet.",
    ),
  ];

  const revisionPriorities = [];
  if (packet.missingItems.length > 0) {
    revisionPriorities.push("Finish the missing required items first.");
  }
  if (packet.privacyWarnings.length > 0) {
    revisionPriorities.push("Use the redacted copy or revise the response text to remove private information.");
  }
  if (responseCount > 0) {
    revisionPriorities.push("Tighten the opening lines so the application sounds specific from the first sentence.");
  }

  return {
    summary: packet.readyToSubmit
      ? "This packet is operationally ready, and the remaining work is quality polish."
      : "The packet has a usable core, but one or more operational gaps still need to be closed before submission.",
    strengths,
    risks,
    revisionPriorities,
    model: "fallback-review",
  };
}

function buildReviewPrompt(packet: ApplicationExportPacket) {
  return [
    "You are a scholarship application reviewer.",
    "Review the packet like a high-quality admissions and scholarship coach.",
    "Be specific, honest, and concise.",
    "Do not invent facts beyond the packet.",
    "Return JSON only with keys: summary, strengths, risks, revisionPriorities.",
    "",
    `Scholarship title: ${packet.title}`,
    `Sponsor: ${packet.sponsorName || "Unknown"}`,
    `Deadline: ${packet.deadline || "Unknown"}`,
    `Ready to submit: ${packet.readyToSubmit ? "yes" : "no"}`,
    `Missing items: ${packet.missingItems.join("; ") || "none"}`,
    `Privacy warnings: ${packet.privacyWarnings.join("; ") || "none"}`,
    "",
    "Packet sections:",
    ...packet.sections.map(
      (section, index) =>
        `${index + 1}. [${section.kind}] ${section.heading}\n${section.redactedBody}`,
    ),
  ].join("\n");
}

export async function reviewApplicationPacket(
  packet: ApplicationExportPacket,
): Promise<ApplicationReviewResult> {
  const fallback = buildFallbackReview(packet);
  const runtime = getVertexReviewRuntimeConfig();

  if (!runtime) {
    return fallback;
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
      contents: buildReviewPrompt(packet),
    });

    const text = response.text?.trim();
    if (!text) {
      return fallback;
    }

    const parsed = parseJsonResponse(text);
    const summary = parsed.summary?.trim();

    if (!summary) {
      return fallback;
    }

    return {
      summary,
      strengths: safeArray(parsed.strengths),
      risks: safeArray(parsed.risks),
      revisionPriorities: safeArray(parsed.revisionPriorities),
      model: runtime.model,
    };
  } catch {
    return fallback;
  }
}
