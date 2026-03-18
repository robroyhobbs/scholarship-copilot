import { ok, unauthorized, tooManyRequests } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { buildApplicationExport } from "@/lib/export/application-export";
import { checkRateLimit } from "@/lib/security/request-limiter";
import { getScholarshipApplicationDetail } from "@/lib/scholarships/application-repository";
import {
  createApplicationVersionSnapshot,
  listApplicationVersions,
} from "@/lib/versions/application-version-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const versions = await listApplicationVersions(user.id, id);
  return ok({ versions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const rateLimit = checkRateLimit(user.id, "application-snapshot", 5, 60_000);
  if (!rateLimit.allowed) {
    return tooManyRequests(
      "Snapshot rate limit exceeded",
      rateLimit.retryAfterSeconds,
    );
  }

  const { id } = await params;
  const application = await getScholarshipApplicationDetail(user.id, id);
  const packet = buildApplicationExport(application);
  const version = await createApplicationVersionSnapshot(user.id, id, packet);

  return ok({ version });
}
