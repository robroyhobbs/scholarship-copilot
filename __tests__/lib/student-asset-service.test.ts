import { beforeEach, describe, expect, it, vi } from "vitest";

const { save } = vi.hoisted(() => ({
  save: vi.fn(),
}));

const {
  createStudentAssetRecord,
  completeStudentAssetRecord,
  failStudentAssetRecord,
} = vi.hoisted(() => ({
  createStudentAssetRecord: vi.fn(),
  completeStudentAssetRecord: vi.fn(),
  failStudentAssetRecord: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        save,
      }),
    }),
  }),
}));

vi.mock("@/lib/assets/student-asset-repository", () => ({
  createStudentAssetRecord,
  completeStudentAssetRecord,
  failStudentAssetRecord,
}));

import { ingestStudentAsset } from "@/lib/assets/student-asset-service";

describe("student asset service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads the file to cloud storage and records a completed asset", async () => {
    createStudentAssetRecord.mockResolvedValue("asset-1");

    const result = await ingestStudentAsset(
      { id: "user-1", email: "maya@example.com" },
      {
        title: "Essay notes",
        assetKind: "essay",
        file: new File(["Dean's List every semester."], "notes.txt", {
          type: "text/plain",
        }),
      },
    );

    expect(save).toHaveBeenCalledTimes(1);
    expect(createStudentAssetRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        title: "Essay notes",
        assetKind: "essay",
        fileName: "notes.txt",
      }),
    );
    expect(completeStudentAssetRecord).toHaveBeenCalledWith(
      "asset-1",
      "user-1",
      expect.objectContaining({
        extractedText: "Dean's List every semester.",
      }),
    );
    expect(result).toEqual({
      assetId: "asset-1",
      status: "completed",
      preview: "Dean's List every semester.",
      chunkCount: 1,
    });
  });

  it("marks the asset failed when parsing cannot extract text", async () => {
    createStudentAssetRecord.mockResolvedValue("asset-2");

    const result = await ingestStudentAsset(
      { id: "user-1", email: "maya@example.com" },
      {
        title: "Empty notes",
        assetKind: "other",
        file: new File([""], "empty.txt", {
          type: "text/plain",
        }),
      },
    );

    expect(failStudentAssetRecord).toHaveBeenCalledWith(
      "asset-2",
      "user-1",
      "Text asset is empty",
    );
    expect(result).toEqual({
      assetId: "asset-2",
      status: "failed",
      preview: "",
      chunkCount: 0,
      processingError: "Text asset is empty",
    });
  });
});
