import { describe, expect, it } from "vitest";
import { generateGroundedDraft } from "@/lib/drafts/generate-grounded-draft";

describe("generateGroundedDraft", () => {
  it("builds an essay draft grounded in student profile data", () => {
    const result = generateGroundedDraft(
      {
        firstName: "Maya",
        lastName: "Carter",
        email: "maya@example.com",
        schoolName: "State University",
        academicYear: "junior",
        intendedMajor: "Computer Science",
        careerGoal: "Build tools that expand access to education",
        gpa: "3.9",
        extracurriculars: ["Robotics Club"],
        leadershipRoles: ["Robotics Club captain"],
        volunteerWork: ["Weekend coding mentor for middle school students"],
        workExperience: ["Peer tutor in the campus STEM center"],
        awards: ["Dean's List"],
        financialNeedContext: "I work part-time to help cover tuition and books.",
        personalThemes: ["First-generation student", "Community-minded builder"],
        writingPreferences: "Warm, direct, and reflective",
        challengesAdversity: "Balancing work hours with a full STEM course load",
      },
      {
        id: "question-1",
        prompt: "Tell us about your leadership in STEM and why it matters.",
        type: "essay",
        orderIndex: 0,
      },
    );

    expect(result.content).toContain("Maya");
    expect(result.content).toContain("Computer Science");
    expect(result.content).toContain("Robotics Club captain");
    expect(result.content).toContain("coding mentor");
    expect(result.grounding).toEqual([
      "intendedMajor",
      "leadershipRoles",
      "volunteerWork",
      "personalThemes",
      "careerGoal",
    ]);
  });

  it("returns an attachment note for attachment questions", () => {
    const result = generateGroundedDraft(
      {
        firstName: "Maya",
        lastName: "Carter",
        email: "maya@example.com",
        schoolName: "State University",
        academicYear: "junior",
        intendedMajor: "Computer Science",
        careerGoal: "Build tools that expand access to education",
        gpa: "",
        extracurriculars: [],
        leadershipRoles: [],
        volunteerWork: [],
        workExperience: [],
        awards: [],
        financialNeedContext: "",
        personalThemes: [],
        writingPreferences: "",
        challengesAdversity: "",
      },
      {
        id: "question-2",
        prompt: "Upload your transcript and resume.",
        type: "attachment",
        orderIndex: 1,
      },
    );

    expect(result.content).toMatch(/prepare the required attachment/i);
    expect(result.grounding).toEqual(["questionType"]);
  });
});
