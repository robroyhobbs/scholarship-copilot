import { ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { listReusableAnswers } from "@/lib/reusable-answers/repository";

export async function GET(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const reusableAnswers = await listReusableAnswers(user.id);
  return ok({ reusableAnswers });
}
