import { ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { seedDemoWorkspaceForUser } from "@/lib/demo/seed-demo";

export async function POST(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const result = await seedDemoWorkspaceForUser(user.id, user.email);
  return ok(result);
}
