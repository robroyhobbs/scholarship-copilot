import { ok, unauthorized, tooManyRequests } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { buildApplicationExport } from "@/lib/export/application-export";
import { reviewApplicationPacket } from "@/lib/review/application-review-service";
import { checkRateLimit } from "@/lib/security/request-limiter";
import { getScholarshipApplicationDetail } from "@/lib/scholarships/application-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const rateLimit = checkRateLimit(user.id, "application-review", 10, 60_000);
  if (!rateLimit.allowed) {
    return tooManyRequests(
      "Application review rate limit exceeded",
      rateLimit.retryAfterSeconds,
    );
  }

  const { id } = await params;
  const application = await getScholarshipApplicationDetail(user.id, id);
  const packet = buildApplicationExport(application);
  const review = await reviewApplicationPacket(packet);

  return ok({ review });
}
