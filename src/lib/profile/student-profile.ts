import { z } from "zod";

export const academicYearOptions = [
  "high-school-senior",
  "freshman",
  "sophomore",
  "junior",
  "senior",
  "graduate",
] as const;

export const studentProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.email("A valid email is required"),
  schoolName: z.string().trim().min(1, "School name is required"),
  academicYear: z.enum(academicYearOptions),
  intendedMajor: z.string().trim().min(1, "Intended major is required"),
  careerGoal: z.string().trim().min(1, "Career goal is required"),
  gpa: z.string().trim().optional().default(""),
  academicInterests: z.array(z.string().trim()).optional().default([]),
  extracurriculars: z.array(z.string().trim()).optional().default([]),
  leadershipRoles: z.array(z.string().trim()).optional().default([]),
  volunteerWork: z.array(z.string().trim()).optional().default([]),
  workExperience: z.array(z.string().trim()).optional().default([]),
  awards: z.array(z.string().trim()).optional().default([]),
  financialNeedContext: z.string().trim().optional().default(""),
  personalThemes: z.array(z.string().trim()).optional().default([]),
  familyBackground: z.string().trim().optional().default(""),
  signatureStories: z.array(z.string().trim()).optional().default([]),
  writingPreferences: z.string().trim().optional().default(""),
  challengesAdversity: z.string().trim().optional().default(""),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export function createEmptyStudentProfile(
  email: string = "",
): StudentProfileInput {
  return {
    firstName: "",
    lastName: "",
    email,
    schoolName: "",
    academicYear: "freshman",
    intendedMajor: "",
    careerGoal: "",
    gpa: "",
    academicInterests: [],
    extracurriculars: [],
    leadershipRoles: [],
    volunteerWork: [],
    workExperience: [],
    awards: [],
    financialNeedContext: "",
    personalThemes: [],
    familyBackground: "",
    signatureStories: [],
    writingPreferences: "",
    challengesAdversity: "",
  };
}

type FieldKind = "string" | "string-array";

interface StudentProfileField {
  key: keyof StudentProfileInput;
  label: string;
  kind: FieldKind;
}

interface StudentProfileSection {
  id: string;
  label: string;
  description: string;
  fields: StudentProfileField[];
}

export const studentProfileSections: StudentProfileSection[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Core details the student will reuse across every application.",
    fields: [
      { key: "firstName", label: "First name", kind: "string" },
      { key: "lastName", label: "Last name", kind: "string" },
      { key: "email", label: "Email", kind: "string" },
    ],
  },
  {
    id: "academics",
    label: "Academics and Direction",
    description: "Academic performance, interests, and where the student wants to go next.",
    fields: [
      { key: "schoolName", label: "School", kind: "string" },
      { key: "academicYear", label: "Academic year", kind: "string" },
      { key: "gpa", label: "GPA", kind: "string" },
      { key: "intendedMajor", label: "Intended major", kind: "string" },
      { key: "academicInterests", label: "Academic interests", kind: "string-array" },
      { key: "careerGoal", label: "Career goal", kind: "string" },
    ],
  },
  {
    id: "experience",
    label: "Activities and Impact",
    description: "Activities, leadership, service, work, and recognition that give applications proof.",
    fields: [
      { key: "extracurriculars", label: "Extracurriculars", kind: "string-array" },
      { key: "leadershipRoles", label: "Leadership roles", kind: "string-array" },
      { key: "volunteerWork", label: "Volunteer work", kind: "string-array" },
      { key: "workExperience", label: "Work experience", kind: "string-array" },
      { key: "awards", label: "Awards", kind: "string-array" },
    ],
  },
  {
    id: "story",
    label: "Background and Story Bank",
    description: "Background, motivations, and core stories the app can reuse across many prompts.",
    fields: [
      { key: "financialNeedContext", label: "Financial need", kind: "string" },
      { key: "personalThemes", label: "Personal themes", kind: "string-array" },
      { key: "familyBackground", label: "Family or background context", kind: "string" },
      { key: "signatureStories", label: "Signature stories", kind: "string-array" },
      { key: "writingPreferences", label: "Writing preferences", kind: "string" },
      { key: "challengesAdversity", label: "Challenges or adversity", kind: "string" },
    ],
  },
];

function isFieldComplete(
  value: StudentProfileInput[keyof StudentProfileInput] | undefined,
  kind: FieldKind,
) {
  if (kind === "string-array") {
    return Array.isArray(value) && value.length > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

export function getStudentProfileCompletion(
  input: Partial<StudentProfileInput>,
) {
  const sections = studentProfileSections.map((section) => {
    const completedFields = section.fields.filter((field) =>
      isFieldComplete(input[field.key], field.kind),
    ).length;
    const totalFields = section.fields.length;

    return {
      id: section.id,
      label: section.label,
      completedFields,
      totalFields,
      percentComplete: Math.round((completedFields / totalFields) * 100),
    };
  });

  const completedFields = sections.reduce(
    (total, section) => total + section.completedFields,
    0,
  );
  const totalFields = sections.reduce(
    (total, section) => total + section.totalFields,
    0,
  );

  return {
    completedFields,
    totalFields,
    percentComplete: Math.round((completedFields / totalFields) * 100),
    sections,
  };
}
