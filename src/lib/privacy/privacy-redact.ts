const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN =
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;

export function redactPrivacySensitiveContent(content: string) {
  return content
    .replace(EMAIL_PATTERN, "[redacted email]")
    .replace(PHONE_PATTERN, "[redacted phone]");
}
