import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentJourneyCard } from "@/components/chrome/student-journey-card";
import type { StudentProfileInput } from "@/lib/profile/student-profile";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api/client";

const mockedApiFetch = vi.mocked(apiFetch);

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
    academicInterests: ["Pediatrics", "Public health"],
    extracurriculars: ["Robotics"],
    leadershipRoles: ["Club president"],
    volunteerWork: ["Food pantry"],
    workExperience: ["Tutor"],
    awards: ["Science award"],
    financialNeedContext: "Needs scholarship support",
    personalThemes: ["Perseverance"],
    familyBackground: "First-generation college student from a bilingual home",
    signatureStories: ["Started a science club mentoring program"],
    writingPreferences: "Warm and direct",
    challengesAdversity: "Balanced school and family care",
    ...overrides,
  };
}

describe("StudentJourneyCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("guides a first-time student to complete their profile first", async () => {
    mockedApiFetch.mockImplementation(async (input) => {
      const url = input.toString();

      if (url === "/api/profile") {
        return new Response(
          JSON.stringify({
            profile: createProfile({
              firstName: "",
              lastName: "",
              schoolName: "",
              intendedMajor: "",
              careerGoal: "",
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
            }),
          }),
          { status: 200 },
        );
      }

      if (url === "/api/applications") {
        return new Response(JSON.stringify({ applications: [] }), { status: 200 });
      }

      if (url === "/api/reusable-answers") {
        return new Response(JSON.stringify({ reusableAnswers: [] }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(React.createElement(StudentJourneyCard));

    expect(
      await screen.findByRole("heading", { name: /your next best move/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3\/20 profile details saved/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /finish your profile first/i }),
    ).toHaveAttribute("href", "/onboarding");
  });

  it("nudges a ready student to start a scholarship workspace", async () => {
    mockedApiFetch.mockImplementation(async (input) => {
      const url = input.toString();

      if (url === "/api/profile") {
        return new Response(JSON.stringify({ profile: createProfile() }), {
          status: 200,
        });
      }

      if (url === "/api/applications") {
        return new Response(JSON.stringify({ applications: [] }), { status: 200 });
      }

      if (url === "/api/reusable-answers") {
        return new Response(JSON.stringify({ reusableAnswers: [] }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(React.createElement(StudentJourneyCard));

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /start your first scholarship workspace/i }),
      ).toHaveAttribute("href", "/scholarships");
    });

    expect(screen.getByText(/0 active workspaces/i)).toBeInTheDocument();
    expect(screen.getByText(/0 saved answers/i)).toBeInTheDocument();
  });
});
