import type { ReusableAnswerSuggestion } from "@/lib/scholarships/application-schema";

const stopWords = new Set([
  "about",
  "after",
  "and",
  "are",
  "for",
  "from",
  "have",
  "into",
  "that",
  "the",
  "their",
  "them",
  "this",
  "through",
  "your",
]);

function toTokens(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !stopWords.has(token)),
    ),
  );
}

function scorePromptOverlap(left: string, right: string) {
  const leftTokens = toTokens(left);
  const rightTokens = new Set(toTokens(right));

  if (leftTokens.length === 0 || rightTokens.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      matches += 1;
    }
  }

  return matches;
}

export function findReusableAnswerSuggestions(
  prompt: string,
  answers: ReusableAnswerSuggestion[],
  limit: number = 2,
) {
  return answers
    .map((answer) => ({
      answer,
      score: scorePromptOverlap(prompt, answer.prompt),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.answer);
}
