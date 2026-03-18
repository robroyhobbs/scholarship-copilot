import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFirebaseAdminAuth } = vi.hoisted(() => ({
  getFirebaseAdminAuth: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminAuth,
}));

import {
  getBearerTokenFromRequest,
  verifyFirebaseUserFromRequest,
} from "@/lib/firebase/auth";

describe("firebase auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts a bearer token from the authorization header", () => {
    const request = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });

    expect(getBearerTokenFromRequest(request)).toBe("token-123");
  });

  it("returns null when no bearer token is present", async () => {
    const request = new Request("http://localhost");

    await expect(verifyFirebaseUserFromRequest(request)).resolves.toBeNull();
  });

  it("verifies the firebase id token and maps the user context", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue({
      uid: "firebase-user-1",
      email: "student@example.com",
    });
    getFirebaseAdminAuth.mockReturnValue({ verifyIdToken });

    const request = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });

    await expect(verifyFirebaseUserFromRequest(request)).resolves.toEqual({
      id: "firebase-user-1",
      email: "student@example.com",
    });
    expect(verifyIdToken).toHaveBeenCalledWith("token-123");
  });
});
