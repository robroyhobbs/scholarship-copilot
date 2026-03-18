import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { updateScholarshipQuestionFollowUpAnswers } from "@/lib/scholarships/question-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as
    | { followUpAnswers?: unknown }
    | null;

  if (
    !body ||
    !Array.isArray(body.followUpAnswers) ||
    body.followUpAnswers.some((value) => typeof value !== "string")
  ) {
    return badRequest("Follow-up context requires a string array");
  }

  const { id } = await params;
  const question = await updateScholarshipQuestionFollowUpAnswers(
    user.id,
    id,
    body.followUpAnswers.map((value) => value.trim()),
  );

  return ok({
    question: {
      id: question.id,
      followUpAnswers: question.followUpAnswers,
    },
  });
}
