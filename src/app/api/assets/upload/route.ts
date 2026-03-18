import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { ingestStudentAsset } from "@/lib/assets/student-asset-service";
import { getStudentAssetFileType, MAX_STUDENT_ASSET_SIZE } from "@/lib/assets/student-assets";
import { getCurrentStudentUser } from "@/lib/auth/user-context";

export async function POST(request: Request) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") || "").trim();
  const assetKind = String(formData.get("asset_kind") || "other");

  if (!(file instanceof File)) {
    return badRequest("No file provided");
  }

  if (!title) {
    return badRequest("Title is required");
  }

  if (!getStudentAssetFileType(file)) {
    return badRequest(
      "Unsupported file type. Please upload PDF, DOCX, TXT, or MD.",
    );
  }

  if (file.size > MAX_STUDENT_ASSET_SIZE) {
    return badRequest("File too large. Please upload a file smaller than 25 MB.");
  }

  try {
    const result = await ingestStudentAsset(user, {
      file,
      title,
      assetKind,
    });

    return ok(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload asset";

    if (/unsupported file type|file too large/i.test(message)) {
      return badRequest(message);
    }

    throw error;
  }
}
