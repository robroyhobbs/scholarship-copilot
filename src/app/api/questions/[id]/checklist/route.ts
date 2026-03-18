import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import { setAttachmentChecklistStatus } from "@/lib/checklist/checklist-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as
    | { completed?: boolean }
    | null;

  if (!body || typeof body.completed !== "boolean") {
    return badRequest("Checklist updates require a completed boolean");
  }

  const { id } = await params;

  try {
    const checklist = await setAttachmentChecklistStatus(
      user.id,
      id,
      body.completed,
    );
    return ok({ checklist });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update checklist";

    if (message.includes("Only attachment questions")) {
      return badRequest(message);
    }

    throw error;
  }
}
