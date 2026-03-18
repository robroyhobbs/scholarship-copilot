import mammoth from "mammoth";

const pdfParse = require("pdf-parse/lib/pdf-parse");

export const MAX_STUDENT_ASSET_SIZE = 25 * 1024 * 1024;

export const ALLOWED_STUDENT_ASSET_TYPES: Record<string, StudentAssetFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "text/markdown": "md",
};

export const STUDENT_ASSET_KINDS = [
  "resume",
  "transcript",
  "essay",
  "award",
  "activity-sheet",
  "reference-note",
  "scholarship-form",
  "other",
] as const;

export type StudentAssetKind = (typeof STUDENT_ASSET_KINDS)[number];
export type StudentAssetFileType = "pdf" | "docx" | "txt" | "md";

export interface ParsedStudentAssetSection {
  heading: string | null;
  content: string;
}

export interface ParsedStudentAsset {
  sections: ParsedStudentAssetSection[];
  extractedText: string;
  preview: string;
}

export interface StudentAssetChunk {
  content: string;
  chunkIndex: number;
  sectionHeading: string | null;
  tokenCount: number;
}

export function getStudentAssetFileType(file: File): StudentAssetFileType | null {
  return ALLOWED_STUDENT_ASSET_TYPES[file.type] ?? null;
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function parsePdf(buffer: Buffer): Promise<ParsedStudentAssetSection[]> {
  const uint8 = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const result = await pdfParse(uint8);
  const text = String(result.text ?? "").trim();

  if (!text) {
    throw new Error("PDF contains no extractable text");
  }

  return [{ heading: null, content: text }];
}

async function parseDocx(buffer: Buffer): Promise<ParsedStudentAssetSection[]> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  const parts = html.split(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
  const sections: ParsedStudentAssetSection[] = [];

  if (parts[0]) {
    const text = stripHtml(parts[0]).trim();
    if (text) {
      sections.push({ heading: null, content: text });
    }
  }

  for (let index = 1; index < parts.length; index += 2) {
    const heading = stripHtml(parts[index] || "").trim();
    const content = stripHtml(parts[index + 1] || "").trim();
    if (heading || content) {
      sections.push({
        heading: heading || null,
        content,
      });
    }
  }

  if (sections.length === 0) {
    const fullText = stripHtml(html);
    if (!fullText) {
      throw new Error("DOCX contains no extractable text");
    }
    sections.push({ heading: null, content: fullText });
  }

  return sections;
}

function parsePlainText(buffer: Buffer): ParsedStudentAssetSection[] {
  const text = buffer.toString("utf8").trim();
  if (!text) {
    throw new Error("Text asset is empty");
  }
  return [{ heading: null, content: text }];
}

function parseMarkdown(buffer: Buffer): ParsedStudentAssetSection[] {
  const text = buffer.toString("utf8").trim();
  if (!text) {
    throw new Error("Markdown asset is empty");
  }

  const lines = text.split(/\r?\n/);
  const sections: ParsedStudentAssetSection[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      const content = currentContent.join("\n").trim();
      if (content) {
        sections.push({ heading: currentHeading, content });
      }
      currentHeading = line.replace(/^#{1,6}\s+/, "").trim() || null;
      currentContent = [];
      continue;
    }

    currentContent.push(line);
  }

  const content = currentContent.join("\n").trim();
  if (content) {
    sections.push({ heading: currentHeading, content });
  }

  return sections.length > 0 ? sections : [{ heading: null, content: text }];
}

export async function parseStudentAssetBuffer(
  buffer: Buffer,
  fileType: StudentAssetFileType,
): Promise<ParsedStudentAsset> {
  let sections: ParsedStudentAssetSection[] = [];

  switch (fileType) {
    case "pdf":
      sections = await parsePdf(buffer);
      break;
    case "docx":
      sections = await parseDocx(buffer);
      break;
    case "txt":
      sections = parsePlainText(buffer);
      break;
    case "md":
      sections = parseMarkdown(buffer);
      break;
  }

  const extractedText = sections
    .map((section) =>
      section.heading ? `${section.heading}\n\n${section.content}` : section.content,
    )
    .join("\n\n")
    .trim();

  return {
    sections,
    extractedText,
    preview: extractedText.slice(0, 500),
  };
}

function countTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function chunkStudentAssetSections(
  sections: ParsedStudentAssetSection[],
): StudentAssetChunk[] {
  const chunks: StudentAssetChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const fullText = section.heading
      ? `${section.heading}\n\n${section.content}`
      : section.content;

    if (countTokens(fullText) <= 1024) {
      chunks.push({
        content: fullText,
        chunkIndex: chunkIndex++,
        sectionHeading: section.heading,
        tokenCount: countTokens(fullText),
      });
      continue;
    }

    const words = fullText.split(/\s+/);
    let start = 0;

    while (start < words.length) {
      let end = start;
      let candidate = "";

      while (end < words.length) {
        const next = words.slice(start, end + 1).join(" ");
        if (countTokens(next) > 512 && end > start) {
          break;
        }
        candidate = next;
        end++;
      }

      chunks.push({
        content: candidate,
        chunkIndex: chunkIndex++,
        sectionHeading: section.heading,
        tokenCount: countTokens(candidate),
      });

      const overlap = Math.max(1, Math.floor((end - start) * 0.1));
      start = Math.max(start + 1, end - overlap);
    }
  }

  return chunks;
}
