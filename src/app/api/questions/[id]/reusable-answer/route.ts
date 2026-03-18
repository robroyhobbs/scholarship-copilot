import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { saveReusableAnswerFromDraft } from "@/lib/reusable-answers/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;

  try {
    const reusableAnswer = await saveReusableAnswerFromDraft(user.id, id);
    return ok({ reusableAnswer });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save reusable answer";

    if (message.includes("generated draft is required")) {
      return badRequest(message);
    }

    throw error;
  }
}
