import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportPacketPanel } from "@/components/scholarships/export-packet-panel";

describe("ExportPacketPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("loads the review packet and renders copy-friendly sections", async () => {
    const writeText = vi.mocked(navigator.clipboard.writeText);
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            packet: {
              title: "STEM Leaders Scholarship",
              sponsorName: "Bright Futures Foundation",
              deadline: "2026-04-15",
              readyToSubmit: false,
              missingItems: ["Upload your transcript."],
              privacyWarnings: ["Contains an email address"],
              sections: [
                {
                  questionId: "question-1",
                  kind: "response",
                  heading: "Tell us about your leadership in STEM.",
                  body: "Generated draft content with maya@example.com",
                  redactedBody: "Generated draft content with [redacted email]",
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            versions: [
              {
                id: "version-1",
                applicationId: "app-1",
                createdAt: "2026-03-16T18:00:00.000Z",
                readyToSubmit: false,
                sectionCount: 1,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            version: {
              id: "version-2",
              applicationId: "app-1",
              createdAt: "2026-03-16T19:00:00.000Z",
              readyToSubmit: false,
              sectionCount: 1,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            review: {
              summary: "Strong application story with one operational gap.",
              strengths: ["Specific STEM leadership example"],
              risks: ["Transcript still missing"],
              revisionPriorities: ["Tighten the opening sentence"],
              model: "gemini-2.5-pro",
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ExportPacketPanel, { applicationId: "app-1" }));

    expect(
      await screen.findByRole("heading", { name: /stem leaders scholarship/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/generated draft content with maya@example.com/i)).toBeInTheDocument();
    expect(await screen.findByText(/upload your transcript/i)).toBeInTheDocument();
    expect(await screen.findByText(/needs one more pass/i)).toBeInTheDocument();
    expect(await screen.findByText(/privacy review needed/i)).toBeInTheDocument();
    expect(await screen.findByText(/contains an email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/version history/i)).toBeInTheDocument();
    expect(await screen.findByText(/submission packet/i)).toBeInTheDocument();
    expect(await screen.findByText(/final handoff copy/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 section saved/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 response ready/i)).toBeInTheDocument();
    expect(await screen.findByText(/0 attachments ready/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 missing item/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 privacy flag/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show redacted copy/i }));
    expect(await screen.findByText(/generated draft content with \[redacted email\]/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /copy redacted version/i }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Generated draft content with [redacted email]"),
    );
    expect(await screen.findByText(/redacted copy ready/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save snapshot/i }));

    expect(await screen.findByText(/snapshot saved/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/applications/app-1/versions", {
      method: "POST",
      headers: expect.any(Headers),
    });

    fireEvent.click(screen.getByRole("button", { name: /run ai review/i }));

    expect(await screen.findByText(/strong application story with one operational gap/i)).toBeInTheDocument();
    expect(await screen.findByText(/specific stem leadership example/i)).toBeInTheDocument();
    expect(await screen.findByText(/transcript still missing/i)).toBeInTheDocument();
    expect(await screen.findByText(/tighten the opening sentence/i)).toBeInTheDocument();
    expect(await screen.findByText(/reviewed with gemini-2.5-pro/i)).toBeInTheDocument();
  });
});
