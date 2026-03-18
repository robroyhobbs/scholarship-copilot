import type { StudentUserContext } from "@/lib/auth/user-context";
import {
  chunkStudentAssetSections,
  getStudentAssetFileType,
  MAX_STUDENT_ASSET_SIZE,
  parseStudentAssetBuffer,
  STUDENT_ASSET_KINDS,
  type StudentAssetKind,
} from "@/lib/assets/student-assets";
import {
  completeStudentAssetRecord,
  createStudentAssetRecord,
  failStudentAssetRecord,
} from "@/lib/assets/student-asset-repository";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";

interface IngestStudentAssetInput {
  file: File;
  title: string;
  assetKind: string;
}

function normalizeAssetKind(value: string): StudentAssetKind {
  return STUDENT_ASSET_KINDS.includes(value as StudentAssetKind)
    ? (value as StudentAssetKind)
    : "other";
}

export async function ingestStudentAsset(
  user: StudentUserContext,
  input: IngestStudentAssetInput,
) {
  const fileType = getStudentAssetFileType(input.file);

  if (!fileType) {
    throw new Error("Unsupported file type");
  }

  if (input.file.size > MAX_STUDENT_ASSET_SIZE) {
    throw new Error("File too large");
  }

  const assetKind = normalizeAssetKind(input.assetKind);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const storagePath = `${user.id}/${assetKind}/${crypto.randomUUID()}-${input.file.name}`;
  const bucket = getFirebaseAdminStorage().bucket();
  await bucket.file(storagePath).save(buffer, {
    metadata: {
      contentType: input.file.type,
    },
  });

  const assetId = await createStudentAssetRecord(user.id, {
    title: input.title,
    assetKind,
    fileName: input.file.name,
    fileType,
    mimeType: input.file.type,
    fileSizeBytes: input.file.size,
    storagePath,
  });

  try {
    const parsed = await parseStudentAssetBuffer(buffer, fileType);
    const chunks = chunkStudentAssetSections(parsed.sections);
    await completeStudentAssetRecord(assetId, user.id, {
      extractedText: parsed.extractedText,
      preview: parsed.preview,
      chunkCount: chunks.length,
      chunks,
    });

    return {
      assetId,
      status: "completed",
      preview: parsed.preview,
      chunkCount: chunks.length,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Asset processing failed";

    await failStudentAssetRecord(assetId, user.id, message);

    return {
      assetId,
      status: "failed",
      preview: "",
      chunkCount: 0,
      processingError: message,
    };
  }
}
