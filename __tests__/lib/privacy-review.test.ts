import { describe, expect, it } from "vitest";
import { detectPrivacyWarnings } from "@/lib/privacy/privacy-review";

describe("detectPrivacyWarnings", () => {
  it("flags obvious email addresses and phone numbers", () => {
    const warnings = detectPrivacyWarnings(
      "Contact me at maya@example.com or 555-123-4567 for follow-up.",
    );

    expect(warnings).toEqual(["Contains an email address", "Contains a phone number"]);
  });

  it("returns no warnings for ordinary scholarship prose", () => {
    const warnings = detectPrivacyWarnings(
      "I hope to expand access to STEM education through community mentoring.",
    );

    expect(warnings).toEqual([]);
  });
});
