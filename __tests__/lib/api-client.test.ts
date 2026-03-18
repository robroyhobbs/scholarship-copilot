import { beforeEach, describe, expect, it, vi } from "vitest";

const getFirebaseIdToken = vi.fn();

vi.mock("@/lib/firebase/client-auth", () => ({
  getFirebaseIdToken,
}));

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    getFirebaseIdToken.mockReset();
  });

  it("adds a bearer token when firebase auth is available", async () => {
    getFirebaseIdToken.mockResolvedValue("token-123");
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const { apiFetch } = await import("@/lib/api/client");

    await apiFetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName: "Maya" }),
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/profile", {
      method: "PUT",
      headers: expect.any(Headers),
      body: JSON.stringify({ firstName: "Maya" }),
    });

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get("Content-Type")).toBe("application/json");
    expect(requestHeaders.get("Authorization")).toBe("Bearer token-123");
  });

  it("falls back to a plain request when no firebase token exists", async () => {
    getFirebaseIdToken.mockResolvedValue(null);
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const { apiFetch } = await import("@/lib/api/client");

    await apiFetch("/api/applications");

    expect(fetchMock).toHaveBeenCalledWith("/api/applications", {
      headers: expect.any(Headers),
    });

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get("Authorization")).toBeNull();
  });
});
