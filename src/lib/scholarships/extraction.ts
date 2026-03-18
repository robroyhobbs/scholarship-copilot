export const scholarshipFocusAreas = [
  "attachment",
  "leadership_service",
  "financial_need",
  "academic_goals",
  "career_goals",
  "identity_background",
  "personal_story",
  "general",
] as const;

export type ScholarshipFocusArea = (typeof scholarshipFocusAreas)[number];

export interface ExtractedScholarshipQuestion {
  prompt: string;
  type: "essay" | "short_answer" | "attachment";
  orderIndex: number;
  focusArea: ScholarshipFocusArea;
  wordLimit: number | null;
  characterLimit: number | null;
}

export interface ExtractedScholarshipDetails {
  deadline: string | null;
  questions: ExtractedScholarshipQuestion[];
}

function normalizeDate(input: string): string | null {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function extractDeadline(text: string): string | null {
  const deadlineMatch = text.match(
    /deadline\s*[:\-]\s*([A-Za-z]+ \d{1,2}, \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i,
  );

  if (!deadlineMatch) {
    return null;
  }

  return normalizeDate(deadlineMatch[1]?.trim() || "");
}

function cleanPrompt(prefix: RegExp, line: string) {
  return line.replace(prefix, "").trim();
}

function normalizeInlinePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

function extractWordLimit(prompt: string) {
  const rangeMatch = prompt.match(/(\d{2,5})\s*-\s*(\d{2,5})\s*words?\b/i);
  if (rangeMatch) {
    return Number.parseInt(rangeMatch[2] ?? "", 10);
  }

  const maxMatch = prompt.match(
    /(\d{2,5})\s*words?\s*(?:or\s+(?:less|fewer)|maximum|max)?\b/i,
  );
  if (maxMatch) {
    return Number.parseInt(maxMatch[1] ?? "", 10);
  }

  return null;
}

function extractCharacterLimit(prompt: string) {
  const rangeMatch = prompt.match(/(\d{2,5})\s*-\s*(\d{2,5})\s*characters?\b/i);
  if (rangeMatch) {
    return Number.parseInt(rangeMatch[2] ?? "", 10);
  }

  const maxMatch = prompt.match(
    /(\d{2,5})\s*characters?\s*(?:or\s+(?:less|fewer)|maximum|max)?\b/i,
  );
  if (maxMatch) {
    return Number.parseInt(maxMatch[1] ?? "", 10);
  }

  return null;
}

function pushQuestion(
  questions: ExtractedScholarshipQuestion[],
  prompt: string,
  type: ExtractedScholarshipQuestion["type"],
) {
  const normalized = normalizeInlinePrompt(prompt);
  if (!normalized) {
    return;
  }

  questions.push({
    prompt: normalized,
    type,
    orderIndex: questions.length,
    focusArea: classifyFocusArea(normalized, type),
    wordLimit: extractWordLimit(normalized),
    characterLimit: extractCharacterLimit(normalized),
  });
}

function classifyFocusArea(
  prompt: string,
  type: ExtractedScholarshipQuestion["type"],
): ScholarshipFocusArea {
  if (type === "attachment") {
    return "attachment";
  }

  const normalized = prompt.toLowerCase();

  if (
    /financial|tuition|cost|afford|scholarship support|need-based|economic|funding/.test(
      normalized,
    )
  ) {
    return "financial_need";
  }

  if (
    /leadership|service|community|mentor|mentoring|impact|difference|help(ed)? others|volunteer/.test(
      normalized,
    )
  ) {
    return "leadership_service";
  }

  if (
    /major|study|education goals|academic|school|college|degree|stem|research|field of study/.test(
      normalized,
    )
  ) {
    return "academic_goals";
  }

  if (/career|profession|future|long-term goal|aspire|professional interests/.test(normalized)) {
    return "career_goals";
  }

  if (
    /background|family|identity|culture|significant influence|who has had a significant influence|adversity|challenge|resilien|lived experience/.test(
      normalized,
    )
  ) {
    return "identity_background";
  }

  if (
    /tell us about|describe|experience|quality|talent|accomplishment|contribution|proud|personal/.test(
      normalized,
    )
  ) {
    return "personal_story";
  }

  return "general";
}

export function extractScholarshipDetails(text: string): ExtractedScholarshipDetails {
  const normalizedText = text.replace(
    /\s+(Essay Prompt\s*:|Short Answer\s*:|Question\s*\d+\s*:|Attachment Requirement\s*:)/gi,
    "\n$1",
  );
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const questions: ExtractedScholarshipQuestion[] = [];

  for (const line of lines) {
    if (/^essay prompt\s*:/i.test(line)) {
      pushQuestion(questions, cleanPrompt(/^essay prompt\s*:/i, line), "essay");
      continue;
    }

    if (/^question\s*\d+\s*:/i.test(line)) {
      pushQuestion(
        questions,
        cleanPrompt(/^question\s*\d+\s*:/i, line),
        "short_answer",
      );
      continue;
    }

    if (/^short answer\s*:/i.test(line)) {
      pushQuestion(
        questions,
        cleanPrompt(/^short answer\s*:/i, line),
        "short_answer",
      );
      continue;
    }

    if (/^attachment requirement\s*:/i.test(line)) {
      pushQuestion(
        questions,
        cleanPrompt(/^attachment requirement\s*:/i, line),
        "attachment",
      );
      continue;
    }

    if (/^upload /i.test(line) || /^submit /i.test(line)) {
      pushQuestion(questions, line, "attachment");
      continue;
    }

    if (/\?$/.test(line)) {
      pushQuestion(questions, line, "short_answer");
    }
  }

  return {
    deadline: extractDeadline(text),
    questions,
  };
}
