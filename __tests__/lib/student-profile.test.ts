import {
  getStudentProfileCompletion,
  studentProfileSchema,
  studentProfileSections,
} from "@/lib/profile/student-profile";

describe("student profile model", () => {
  it("accepts a minimally valid profile", () => {
    const result = studentProfileSchema.safeParse({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
    });

    expect(result.success).toBe(true);
  });

  it("accepts expanded scholarship context fields for background and story material", () => {
    const result = studentProfileSchema.safeParse({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
      academicInterests: ["Human-centered computing", "Education policy"],
      familyBackground:
        "First-generation college student in a bilingual immigrant household.",
      signatureStories: [
        "Started a peer tutoring night for ninth-grade math students.",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("computes completion across the defined profile sections", () => {
    const completion = getStudentProfileCompletion({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      gpa: "3.9",
      intendedMajor: "Computer Science",
      academicInterests: ["Human-centered computing"],
      careerGoal: "Build tools that expand access to education",
      extracurriculars: ["Robotics Club"],
      leadershipRoles: [],
      volunteerWork: [],
      workExperience: [],
      awards: [],
      personalThemes: ["First-generation student", "STEM mentor"],
      familyBackground: "Raised in a bilingual immigrant household",
      signatureStories: ["Tutored middle-school students after class"],
      writingPreferences: "Warm, direct, and reflective",
    });

    expect(studentProfileSections).toHaveLength(4);
    expect(completion.completedFields).toBe(14);
    expect(completion.totalFields).toBe(20);
    expect(completion.percentComplete).toBe(70);
    expect(completion.sections[0]).toEqual({
      id: "identity",
      label: "Identity",
      completedFields: 3,
      totalFields: 3,
      percentComplete: 100,
    });
    expect(completion.sections[1]).toEqual({
      id: "academics",
      label: "Academics and Direction",
      completedFields: 6,
      totalFields: 6,
      percentComplete: 100,
    });
    expect(completion.sections[2]).toEqual({
      id: "experience",
      label: "Activities and Impact",
      completedFields: 1,
      totalFields: 5,
      percentComplete: 20,
    });
    expect(completion.sections[3]).toEqual({
      id: "story",
      label: "Background and Story Bank",
      completedFields: 4,
      totalFields: 6,
      percentComplete: 67,
    });
  });
});
