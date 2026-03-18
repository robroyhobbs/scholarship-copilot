import { describe, expect, it } from "vitest";
import { redactPrivacySensitiveContent } from "@/lib/privacy/privacy-redact";

describe("redactPrivacySensitiveContent", () => {
  it("redacts email addresses and phone numbers", () => {
    const redacted = redactPrivacySensitiveContent(
      "Reach me at maya@example.com or 555-123-4567.",
    );

    expect(redacted).toContain("[redacted email]");
    expect(redacted).toContain("[redacted phone]");
    expect(redacted).not.toContain("maya@example.com");
    expect(redacted).not.toContain("555-123-4567");
  });
});
