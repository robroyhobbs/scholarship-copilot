import { created, ok, unauthorized, badRequest } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import {
  createScholarshipWorkspace,
  listScholarshipApplications,
} from "@/lib/scholarships/application-repository";
import { scholarshipWorkspaceSchema } from "@/lib/scholarships/application-schema";

export async function GET(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const applications = await listScholarshipApplications(user.id);
  return ok({ applications });
}

export async function POST(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const payload = await request.json();
  const parsed = scholarshipWorkspaceSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid scholarship workspace");
  }

  const application = await createScholarshipWorkspace(user.id, parsed.data);
  return created({ application });
}
