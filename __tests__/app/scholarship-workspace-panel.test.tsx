import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScholarshipWorkspacePanel } from "@/components/scholarships/scholarship-workspace-panel";

const { ensureFirebaseClientSession, getFirebaseIdToken } = vi.hoisted(() => ({
  ensureFirebaseClientSession: vi.fn(),
  getFirebaseIdToken: vi.fn(),
}));

vi.mock("@/lib/firebase/client-auth", () => ({
  ensureFirebaseClientSession,
  getFirebaseIdToken,
}));

describe("ScholarshipWorkspacePanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ensureFirebaseClientSession.mockResolvedValue(null);
    getFirebaseIdToken.mockResolvedValue("token-123");
  });

  it("loads applications and creates a new workspace", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            applications: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            application: {
              id: "app-1",
              scholarshipId: "scholarship-1",
              title: "STEM Leaders Scholarship",
              sponsorName: "Bright Futures Foundation",
              sourceType: "paste",
              status: "draft",
            },
          }),
          { status: 201 },
        ),
      );

    render(React.createElement(ScholarshipWorkspacePanel));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/applications", {
        headers: expect.any(Headers),
      });
    });

    fireEvent.change(screen.getByLabelText(/scholarship title/i), {
      target: { value: "STEM Leaders Scholarship" },
    });
    fireEvent.change(screen.getByLabelText(/sponsor/i), {
      target: { value: "Bright Futures Foundation" },
    });
    fireEvent.change(screen.getByLabelText(/application text/i), {
      target: {
        value: "Essay Prompt: Tell us about your leadership in STEM.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/applications", {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({
          title: "STEM Leaders Scholarship",
          sponsorName: "Bright Futures Foundation",
          sourceType: "paste",
          sourceText: "Essay Prompt: Tell us about your leadership in STEM.",
        }),
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: /stem leaders scholarship/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows a guided intake planner before the workspace is created", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          applications: [],
        }),
        { status: 200 },
      ),
    );

    render(React.createElement(ScholarshipWorkspacePanel));

    expect(await screen.findByText(/intake desk/i)).toBeInTheDocument();
    expect(await screen.findByText(/what to paste here/i)).toBeInTheDocument();
    expect(screen.getByText(/before you create the workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/missing a scholarship title/i)).toBeInTheDocument();
    expect(screen.getByText(/paste the full scholarship text/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/scholarship title/i), {
      target: { value: "STEM Leaders Scholarship" },
    });
    fireEvent.change(screen.getByLabelText(/application text/i), {
      target: {
        value:
          "Essay Prompt: Tell us about your leadership in STEM. Deadline: April 15, 2026. Include your transcript.",
      },
    });

    expect(screen.getByText(/ready to create/i)).toBeInTheDocument();
    expect(screen.getByText(/scholarship text looks substantial enough to extract/i)).toBeInTheDocument();
  });

  it("can seed demo data for the current student session", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            applications: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            applicationId: "demo-app-1",
            applications: [
              {
                id: "demo-app-1",
                scholarshipId: "demo-app-1",
                title: "Bright Futures STEM Scholarship",
                sponsorName: "Bright Futures Foundation",
                sourceType: "paste",
                status: "draft",
                extractionStatus: "completed",
                deadline: "2026-04-15",
                questionCount: 3,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ScholarshipWorkspacePanel));

    fireEvent.click(
      await screen.findByRole("button", { name: /load demo data/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/demo-seed", {
        method: "POST",
        headers: expect.any(Headers),
      });
    });

    expect(await screen.findByText(/demo workspace ready/i)).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: /bright futures stem scholarship/i,
      }),
    ).toBeInTheDocument();
  });

  it("waits for firebase auth before loading workspaces", async () => {
    let resolveAuth: (() => void) | null = null;
    ensureFirebaseClientSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuth = () => resolve(null);
        }),
    );

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          applications: [],
        }),
        { status: 200 },
      ),
    );

    render(React.createElement(ScholarshipWorkspacePanel));

    expect(
      await screen.findByText(/connecting your secure workspace/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    resolveAuth?.();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/applications", {
        headers: expect.any(Headers),
      });
    });
  });

  it("runs extraction and updates the displayed question count", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            applications: [
              {
                id: "app-1",
                scholarshipId: "scholarship-1",
                title: "STEM Leaders Scholarship",
                sponsorName: "Bright Futures Foundation",
                sourceType: "paste",
                status: "draft",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            questionCount: 2,
            deadline: "2026-04-15",
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ScholarshipWorkspacePanel));

    fireEvent.click(
      await screen.findByRole("button", { name: /extract questions/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/applications/app-1/extract", {
        method: "POST",
        headers: expect.any(Headers),
      });
    });

    expect(await screen.findByText(/2 questions extracted/i)).toBeInTheDocument();
    expect(await screen.findByText(/deadline 2026-04-15/i)).toBeInTheDocument();
  });
});
