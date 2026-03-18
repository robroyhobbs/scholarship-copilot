import React from "react";
import { render, screen } from "@testing-library/react";
import { StudentProfileForm } from "@/components/onboarding/student-profile-form";
import type { StudentProfileInput } from "@/lib/profile/student-profile";

function createProfile(
  overrides: Partial<StudentProfileInput> = {},
): StudentProfileInput {
  return {
    firstName: "Avery",
    lastName: "Jones",
    email: "avery@example.com",
    schoolName: "Central High",
    academicYear: "senior",
    intendedMajor: "Biology",
    careerGoal: "Become a pediatrician",
    gpa: "3.9",
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
    ...overrides,
  };
}

describe("StudentProfileForm", () => {
  it("shows guided section progress instead of only one total count", () => {
    render(
      React.createElement(StudentProfileForm, {
        initialProfile: createProfile(),
      }),
    );

    expect(screen.getByText(/best first pass/i)).toBeInTheDocument();
    expect(screen.getByText(/^Identity$/)).toBeInTheDocument();
    expect(screen.getByText(/3\/3 complete/i)).toBeInTheDocument();
    expect(screen.getByText(/^Academics and Direction$/)).toBeInTheDocument();
    expect(screen.getByText(/5\/6 complete/i)).toBeInTheDocument();
    expect(screen.getByText(/^Activities and Impact$/)).toBeInTheDocument();
    expect(screen.getByText(/0\/5 complete/i)).toBeInTheDocument();
  });

  it("shows scholarship-specific background fields beyond basic academics", () => {
    render(
      React.createElement(StudentProfileForm, {
        initialProfile: createProfile(),
      }),
    );

    expect(screen.getByLabelText(/activities and clubs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/community involvement and service/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/family or background context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/story bank/i)).toBeInTheDocument();
  });

  it("frames the profile as an evidence bank for future applications", () => {
    render(
      React.createElement(StudentProfileForm, {
        initialProfile: createProfile(),
      }),
    );

    expect(screen.getByText(/what strong applications usually need/i)).toBeInTheDocument();
    expect(screen.getByText(/story bank moments/i)).toBeInTheDocument();
    expect(screen.getByText(/impact and leadership proof/i)).toBeInTheDocument();
  });
});
