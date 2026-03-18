import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { StudentProfileInput } from "@/lib/profile/student-profile";

interface StudentProfileDocument {
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  academicYear: StudentProfileInput["academicYear"];
  intendedMajor: string;
  careerGoal: string;
  gpa?: string;
  academicInterests?: string[];
  extracurriculars?: string[];
  leadershipRoles?: string[];
  volunteerWork?: string[];
  workExperience?: string[];
  awards?: string[];
  financialNeedContext?: string;
  personalThemes?: string[];
  familyBackground?: string;
  signatureStories?: string[];
  writingPreferences?: string;
  challengesAdversity?: string;
}

function getProfileDocument(userId: string) {
  return getFirebaseAdminDb().collection("studentProfiles").doc(userId);
}

function mapDocumentToProfile(
  document: StudentProfileDocument,
): StudentProfileInput {
  return {
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    schoolName: document.schoolName,
    academicYear: document.academicYear,
    intendedMajor: document.intendedMajor,
    careerGoal: document.careerGoal,
    gpa: document.gpa ?? "",
    academicInterests: document.academicInterests ?? [],
    extracurriculars: document.extracurriculars ?? [],
    leadershipRoles: document.leadershipRoles ?? [],
    volunteerWork: document.volunteerWork ?? [],
    workExperience: document.workExperience ?? [],
    awards: document.awards ?? [],
    financialNeedContext: document.financialNeedContext ?? "",
    personalThemes: document.personalThemes ?? [],
    familyBackground: document.familyBackground ?? "",
    signatureStories: document.signatureStories ?? [],
    writingPreferences: document.writingPreferences ?? "",
    challengesAdversity: document.challengesAdversity ?? "",
  };
}

function mapProfileToDocument(
  profile: StudentProfileInput,
): StudentProfileDocument {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    schoolName: profile.schoolName,
    academicYear: profile.academicYear,
    intendedMajor: profile.intendedMajor,
    careerGoal: profile.careerGoal,
    gpa: profile.gpa || "",
    academicInterests: profile.academicInterests,
    extracurriculars: profile.extracurriculars,
    leadershipRoles: profile.leadershipRoles,
    volunteerWork: profile.volunteerWork,
    workExperience: profile.workExperience,
    awards: profile.awards,
    financialNeedContext: profile.financialNeedContext || "",
    personalThemes: profile.personalThemes,
    familyBackground: profile.familyBackground || "",
    signatureStories: profile.signatureStories,
    writingPreferences: profile.writingPreferences || "",
    challengesAdversity: profile.challengesAdversity || "",
  };
}

export async function readStudentProfileByUserId(userId: string) {
  const snapshot = await getProfileDocument(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return mapDocumentToProfile(snapshot.data() as StudentProfileDocument);
}

export async function upsertStudentProfileForUser(
  userId: string,
  profile: StudentProfileInput,
) {
  const documentRef = getProfileDocument(userId);

  await documentRef.set(mapProfileToDocument(profile), {
    merge: true,
  });

  const snapshot = await documentRef.get();
  return mapDocumentToProfile(snapshot.data() as StudentProfileDocument);
}
