// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_STUDENT_ASSET_SIZE } from "@/lib/assets/student-assets";

const { getCurrentStudentUser, ingestStudentAsset } = vi.hoisted(() => ({
  getCurrentStudentUser: vi.fn(),
  ingestStudentAsset: vi.fn(),
}));

vi.mock("@/lib/auth/user-context", () => ({
  getCurrentStudentUser,
}));

vi.mock("@/lib/assets/student-asset-service", () => ({
  ingestStudentAsset,
}));

import { POST } from "@/app/api/assets/upload/route";

describe("POST /api/assets/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    getCurrentStudentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("title", "Scholarship Essay");

    const response = await POST(
      new Request("http://localhost/api/assets/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects unsupported file types", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });

    const formData = new FormData();
    formData.set("title", "Zip upload");
    formData.set(
      "file",
      new File(["bad"], "archive.zip", { type: "application/zip" }),
    );

    const response = await POST(
      new Request("http://localhost/api/assets/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unsupported file type/i);
  });

  it("rejects oversized uploads before ingestion", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });

    const oversized = new File(
      [new Uint8Array(MAX_STUDENT_ASSET_SIZE + 1)],
      "large.txt",
      { type: "text/plain" },
    );

    const formData = new FormData();
    formData.set("title", "Large transcript");
    formData.set("file", oversized);

    const response = await POST(
      new Request("http://localhost/api/assets/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/file too large/i);
    expect(ingestStudentAsset).not.toHaveBeenCalled();
  });

  it("uploads a valid asset and returns the processed summary", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    ingestStudentAsset.mockResolvedValue({
      assetId: "asset-1",
      status: "completed",
      preview: "Dean's list every semester.",
      chunkCount: 2,
    });

    const formData = new FormData();
    formData.set("title", "Resume Notes");
    formData.set("asset_kind", "essay");
    formData.set(
      "file",
      new File(["Dean's list every semester"], "notes.txt", {
        type: "text/plain",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/assets/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(ingestStudentAsset).toHaveBeenCalledWith(
      {
        id: "user-1",
        email: "maya@example.com",
      },
      expect.objectContaining({
        title: "Resume Notes",
        assetKind: "essay",
      }),
    );
    expect(body).toEqual({
      assetId: "asset-1",
      status: "completed",
      preview: "Dean's list every semester.",
      chunkCount: 2,
    });
  });

  it("returns processing failures with an explicit error message", async () => {
    getCurrentStudentUser.mockResolvedValue({
      id: "user-1",
      email: "maya@example.com",
    });
    ingestStudentAsset.mockResolvedValue({
      assetId: "asset-2",
      status: "failed",
      preview: "",
      chunkCount: 0,
      processingError: "PDF contains no extractable text",
    });

    const formData = new FormData();
    formData.set("title", "Scanned PDF");
    formData.set(
      "file",
      new File(["scan"], "scan.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/assets/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      assetId: "asset-2",
      status: "failed",
      preview: "",
      chunkCount: 0,
      processingError: "PDF contains no extractable text",
    });
  });
});
