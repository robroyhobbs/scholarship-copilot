import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseAuthBootstrap } from "@/components/auth/firebase-auth-bootstrap";

const { ensureFirebaseClientSession } = vi.hoisted(() => ({
  ensureFirebaseClientSession: vi.fn(),
}));

vi.mock("@/lib/firebase/client-auth", () => ({
  ensureFirebaseClientSession,
}));

describe("FirebaseAuthBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts the firebase client session on mount", async () => {
    ensureFirebaseClientSession.mockResolvedValue(null);

    render(React.createElement(FirebaseAuthBootstrap));

    await waitFor(() => {
      expect(ensureFirebaseClientSession).toHaveBeenCalledTimes(1);
    });
  });
});
