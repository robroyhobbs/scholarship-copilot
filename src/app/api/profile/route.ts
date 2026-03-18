import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import {
  createEmptyStudentProfile,
  studentProfileSchema,
} from "@/lib/profile/student-profile";
import {
  readStudentProfileByUserId,
  upsertStudentProfileForUser,
} from "@/lib/profile/profile-repository";

export async function GET(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const profile = await readStudentProfileByUserId(user.id);

  return ok({
    profile: profile ?? createEmptyStudentProfile(user.email ?? ""),
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const payload = await request.json();
  const parsed = studentProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid student profile");
  }

  const profile = await upsertStudentProfileForUser(user.id, parsed.data);

  return ok({ profile });
}
