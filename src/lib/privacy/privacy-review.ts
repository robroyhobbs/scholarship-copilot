const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN =
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;

export function detectPrivacyWarnings(content: string) {
  const warnings: string[] = [];

  if (EMAIL_PATTERN.test(content)) {
    warnings.push("Contains an email address");
  }

  if (PHONE_PATTERN.test(content)) {
    warnings.push("Contains a phone number");
  }

  return warnings;
}
