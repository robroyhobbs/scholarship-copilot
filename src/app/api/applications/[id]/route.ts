import { ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { getScholarshipApplicationDetail } from "@/lib/scholarships/application-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const application = await getScholarshipApplicationDetail(user.id, id);

  return ok({ application });
}
