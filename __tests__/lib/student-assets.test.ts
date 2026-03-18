import { describe, expect, it } from "vitest";
import {
  chunkStudentAssetSections,
  parseStudentAssetBuffer,
} from "@/lib/assets/student-assets";

describe("student asset parsing", () => {
  it("parses plain text assets into extracted text and preview", async () => {
    const text = "Academic honors\n\nDean's list every semester.\nVolunteer mentor for robotics camp.";
    const result = await parseStudentAssetBuffer(Buffer.from(text), "txt");

    expect(result.extractedText).toContain("Academic honors");
    expect(result.preview).toContain("Dean's list");
    expect(result.sections).toHaveLength(1);
  });

  it("chunks long sections into numbered chunks", () => {
    const chunks = chunkStudentAssetSections([
      {
        heading: "Essay",
        content: "service ".repeat(900),
      },
    ]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });
});
