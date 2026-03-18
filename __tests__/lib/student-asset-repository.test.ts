import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getFirebaseAdminDb,
  collection,
  rootDoc,
  set,
  get,
  chunkCollection,
  chunkDoc,
  chunkSet,
} = vi.hoisted(() => {
  const set = vi.fn();
  const get = vi.fn();
  const chunkSet = vi.fn();
  const chunkDoc = vi.fn(() => ({
    set: chunkSet,
  }));
  const chunkCollection = vi.fn(() => ({
    doc: chunkDoc,
  }));
  const rootDoc = vi.fn(() => ({
    set,
    get,
    collection: chunkCollection,
  }));
  const collection = vi.fn(() => ({
    doc: rootDoc,
  }));
  const getFirebaseAdminDb = vi.fn(() => ({
    collection,
  }));

  return {
    getFirebaseAdminDb,
    collection,
    rootDoc,
    set,
    get,
    chunkCollection,
    chunkDoc,
    chunkSet,
  };
});

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import {
  completeStudentAssetRecord,
  createStudentAssetRecord,
  readStudentAssetExtractedTextById,
} from "@/lib/assets/student-asset-repository";

describe("student asset repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a pending asset record in firestore", async () => {
    const assetId = await createStudentAssetRecord("user-1", {
      title: "Transcript",
      assetKind: "transcript",
      fileName: "transcript.txt",
      fileType: "txt",
      mimeType: "text/plain",
      fileSizeBytes: 24,
      storagePath: "user-1/transcript/file.txt",
    });

    expect(assetId).toMatch(/[0-9a-f-]{36}/i);
    expect(collection).toHaveBeenCalledWith("studentAssets");
    expect(rootDoc).toHaveBeenCalledWith(assetId);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        title: "Transcript",
        processingStatus: "pending",
        storagePath: "user-1/transcript/file.txt",
      }),
    );
  });

  it("stores completed extracted text and chunk records", async () => {
    await completeStudentAssetRecord("asset-1", "user-1", {
      extractedText: "Dean's List every semester.",
      preview: "Dean's List every semester.",
      chunkCount: 1,
      chunks: [
        {
          chunkIndex: 0,
          content: "Dean's List every semester.",
          sectionHeading: null,
          tokenCount: 7,
        },
      ],
    });

    expect(rootDoc).toHaveBeenCalledWith("asset-1");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        processingStatus: "completed",
        extractedText: "Dean's List every semester.",
        chunkCount: 1,
      }),
      { merge: true },
    );
    expect(chunkCollection).toHaveBeenCalledWith("chunks");
    expect(chunkDoc).toHaveBeenCalledWith("0");
    expect(chunkSet).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: "asset-1",
        userId: "user-1",
        content: "Dean's List every semester.",
      }),
    );
  });

  it("reads extracted text for an asset only when it belongs to the user", async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        extractedText: "Leadership essay draft.",
      }),
    });

    await expect(
      readStudentAssetExtractedTextById("user-1", "asset-1"),
    ).resolves.toBe("Leadership essay draft.");
  });
});
