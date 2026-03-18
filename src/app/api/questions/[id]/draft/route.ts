import { ok, unauthorized, badRequest, tooManyRequests } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { generateDraftForQuestion } from "@/lib/drafts/draft-generation-service";
import { getDraftReadiness } from "@/lib/drafts/draft-readiness";
import { getQuestionForDraft, saveDraftResponse } from "@/lib/drafts/draft-repository";
import { readStudentProfileByUserId } from "@/lib/profile/profile-repository";
import { checkRateLimit } from "@/lib/security/request-limiter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const rateLimit = checkRateLimit(user.id, "draft-generation", 10, 60_000);
  if (!rateLimit.allowed) {
    return tooManyRequests(
      "Draft generation rate limit exceeded",
      rateLimit.retryAfterSeconds,
    );
  }

  const profile = await readStudentProfileByUserId(user.id);
  if (!profile) {
    return badRequest("Student profile is required before generating drafts");
  }

  const { id } = await params;
  const question = await getQuestionForDraft(user.id, id);
  const readiness = getDraftReadiness(profile, question);

  if (!readiness.ready) {
    return ok({
      needsMoreInfo: true,
      followUpQuestions: readiness.followUpQuestions,
    });
  }

  const generated = await generateDraftForQuestion(profile, question);
  const draft = await saveDraftResponse(user.id, {
    applicationId: question.applicationId,
    questionId: question.id,
    content: generated.content,
    grounding: generated.grounding,
  });

  return ok({ draft });
}
