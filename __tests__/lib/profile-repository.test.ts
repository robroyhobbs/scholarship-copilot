import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getFirebaseAdminDb,
  collection,
  doc,
  get,
  set,
} = vi.hoisted(() => {
  const get = vi.fn();
  const set = vi.fn();
  const doc = vi.fn(() => ({
    get,
    set,
  }));
  const collection = vi.fn(() => ({
    doc,
  }));
  const getFirebaseAdminDb = vi.fn(() => ({
    collection,
  }));

  return {
    getFirebaseAdminDb,
    collection,
    doc,
    get,
    set,
  };
});

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import {
  readStudentProfileByUserId,
  upsertStudentProfileForUser,
} from "@/lib/profile/profile-repository";

describe("profile repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when a firestore profile document does not exist", async () => {
    get.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    await expect(readStudentProfileByUserId("user-1")).resolves.toBeNull();
    expect(collection).toHaveBeenCalledWith("studentProfiles");
    expect(doc).toHaveBeenCalledWith("user-1");
  });

  it("reads a firestore profile document into the student profile shape", async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({
        firstName: "Maya",
        lastName: "Carter",
        email: "maya@example.com",
        schoolName: "State University",
        academicYear: "junior",
        intendedMajor: "Computer Science",
        careerGoal: "Build tools that expand access to education",
      }),
    });

    await expect(readStudentProfileByUserId("user-1")).resolves.toEqual({
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
  });

  it("upserts the firestore profile document and returns the stored profile", async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({
        firstName: "Maya",
        lastName: "Carter",
        email: "maya@example.com",
        schoolName: "State University",
        academicYear: "junior",
        intendedMajor: "Computer Science",
        careerGoal: "Build tools that expand access to education",
        leadershipRoles: ["Robotics Club President"],
      }),
    });

    await expect(
      upsertStudentProfileForUser("user-1", {
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
        leadershipRoles: ["Robotics Club President"],
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
    ).resolves.toEqual({
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
      leadershipRoles: ["Robotics Club President"],
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

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Maya",
        leadershipRoles: ["Robotics Club President"],
      }),
      { merge: true },
    );
  });
});
