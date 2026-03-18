import { badRequest, ok, tooManyRequests, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import {
  getQuestionForDraft,
  readDraftResponse,
  saveDraftResponse,
} from "@/lib/drafts/draft-repository";
import {
  rewriteDraftForQuestion,
  type DraftRewriteAction,
} from "@/lib/drafts/draft-rewrite-service";
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

  const rateLimit = checkRateLimit(user.id, "draft-rewrite", 10, 60_000);
  if (!rateLimit.allowed) {
    return tooManyRequests(
      "Draft rewrite rate limit exceeded",
      rateLimit.retryAfterSeconds,
    );
  }

  const profile = await readStudentProfileByUserId(user.id);
  if (!profile) {
    return badRequest("Student profile is required before rewriting drafts");
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: DraftRewriteAction }
    | null;
  if (!body?.action) {
    return badRequest("Rewrite action is required");
  }

  const { id } = await params;
  const question = await getQuestionForDraft(user.id, id);
  const existingDraft = await readDraftResponse(user.id, id);

  if (!existingDraft) {
    return badRequest("A generated draft is required before rewriting");
  }

  const rewrittenContent = await rewriteDraftForQuestion(
    question,
    existingDraft.content,
    body.action,
  );
  const draft = await saveDraftResponse(user.id, {
    applicationId: question.applicationId,
    questionId: question.id,
    content: rewrittenContent,
    grounding: existingDraft.grounding,
  });

  return ok({ draft });
}
