import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  StudentAssetChunk,
  StudentAssetFileType,
  StudentAssetKind,
} from "@/lib/assets/student-assets";

interface CreateStudentAssetRecordInput {
  title: string;
  assetKind: StudentAssetKind;
  fileName: string;
  fileType: StudentAssetFileType;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
}

interface CompleteStudentAssetRecordInput {
  extractedText: string;
  preview: string;
  chunkCount: number;
  chunks: StudentAssetChunk[];
}

function getAssetDocument(assetId: string) {
  return getFirebaseAdminDb().collection("studentAssets").doc(assetId);
}

export async function createStudentAssetRecord(
  userId: string,
  input: CreateStudentAssetRecordInput,
) {
  const assetId = crypto.randomUUID();

  await getAssetDocument(assetId).set({
    userId,
    title: input.title,
    assetKind: input.assetKind,
    fileName: input.fileName,
    fileType: input.fileType,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    storagePath: input.storagePath,
    processingStatus: "pending",
    chunkCount: 0,
    extractedText: "",
    parsedTextPreview: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return assetId;
}

export async function completeStudentAssetRecord(
  assetId: string,
  userId: string,
  input: CompleteStudentAssetRecordInput,
) {
  const documentRef = getAssetDocument(assetId);

  await documentRef.set(
    {
      userId,
      processingStatus: "completed",
      extractedText: input.extractedText,
      parsedTextPreview: input.preview,
      chunkCount: input.chunkCount,
      processingError: "",
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  for (const chunk of input.chunks) {
    await documentRef
      .collection("chunks")
      .doc(String(chunk.chunkIndex))
      .set({
        assetId,
        userId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        sectionHeading: chunk.sectionHeading,
        tokenCount: chunk.tokenCount,
      });
  }
}

export async function failStudentAssetRecord(
  assetId: string,
  userId: string,
  processingError: string,
) {
  await getAssetDocument(assetId).set(
    {
      userId,
      processingStatus: "failed",
      processingError,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function readStudentAssetExtractedTextById(
  userId: string,
  assetId: string,
) {
  const snapshot = await getAssetDocument(assetId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as
    | {
        userId?: string;
        extractedText?: string;
      }
    | undefined;

  if (!data || data.userId !== userId) {
    return null;
  }

  return data.extractedText ?? "";
}
