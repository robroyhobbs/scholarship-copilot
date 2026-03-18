import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentStudentUser,
  readStudentProfileByUserId,
  upsertStudentProfileForUser,
} = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  readStudentProfileByUserId: vi.fn(),
  upsertStudentProfileForUser: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/profile/profile-repository", () => ({
  readStudentProfileByUserId,
  upsertStudentProfileForUser,
}));

import { GET, PUT } from "@/app/api/profile/route";

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a seeded empty profile for an authenticated student without saved data", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    readStudentProfileByUserId.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.firstName).toBe("");
    expect(body.profile.email).toBe("maya@example.com");
  });

  it("rejects unauthenticated access", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toMatch(/unauthorized/i);
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates and persists a student profile", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    upsertStudentProfileForUser.mockResolvedValue({
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
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
    });

    const response = await PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          firstName: "Maya",
          lastName: "Carter",
          email: "maya@example.com",
          schoolName: "State University",
          academicYear: "junior",
          intendedMajor: "Computer Science",
          careerGoal: "Build tools that expand access to education",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(upsertStudentProfileForUser).toHaveBeenCalledWith("user-1", {
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      schoolName: "State University",
      academicYear: "junior",
      intendedMajor: "Computer Science",
      careerGoal: "Build tools that expand access to education",
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
    });
    expect(body.profile.firstName).toBe("Maya");
  });

  it("rejects invalid profile payloads", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });

    const response = await PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          firstName: "",
          lastName: "Carter",
          email: "maya@example.com",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid student profile/i);
  });
});
