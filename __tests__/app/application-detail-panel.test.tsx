import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationDetailPanel } from "@/components/scholarships/application-detail-panel";

describe("ApplicationDetailPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads detail data and generates a draft for a question", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
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
              extractionStatus: "completed",
              deadline: "2026-04-15",
              questions: [
                {
                  id: "question-1",
                  prompt: "Tell us about your leadership in STEM.",
                  type: "essay",
                  focusArea: "leadership_service",
                  orderIndex: 0,
                  draft: null,
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
            draft: {
              id: "draft-1",
              questionId: "question-1",
              content: "Generated draft content",
              grounding: ["leadershipRoles"],
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ApplicationDetailPanel, { applicationId: "app-1" }));

    expect(
      await screen.findByRole("heading", { name: /tell us about your leadership in stem/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/focus area: leadership service/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /generate draft for question 1/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/questions/question-1/draft", {
        method: "POST",
        headers: expect.any(Headers),
      });
    });

    expect(await screen.findByText(/generated draft content/i)).toBeInTheDocument();
    expect(await screen.findByText(/grounded in leadershipRoles/i)).toBeInTheDocument();
  });

  it("shows reusable suggestions and saves a draft to the answer library", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
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
              extractionStatus: "completed",
              deadline: "2026-04-15",
              questions: [
                {
                  id: "question-1",
                  prompt: "Tell us about your leadership in STEM.",
                  type: "essay",
                  focusArea: "leadership_service",
                  orderIndex: 0,
                  draft: {
                    id: "draft-1",
                    content: "Generated draft content",
                    grounding: ["leadershipRoles"],
                  },
                  suggestions: [
                    {
                      id: "answer-2",
                      prompt: "Describe your leadership in STEM clubs.",
                      content: "I led the robotics team.",
                      grounding: ["leadershipRoles"],
                    },
                  ],
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
            reusableAnswer: {
              id: "answer-1",
              questionId: "question-1",
              prompt: "Tell us about your leadership in STEM.",
              content: "Generated draft content",
              grounding: ["leadershipRoles"],
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ApplicationDetailPanel, { applicationId: "app-1" }));

    expect(await screen.findByText(/reusable library match/i)).toBeInTheDocument();
    expect(await screen.findByText(/i led the robotics team/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 extracted prompt/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 answer drafted/i)).toBeInTheDocument();
    expect(await screen.findByText(/0 answers saved/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /save draft 1 to reusable library/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/questions/question-1/reusable-answer",
        {
          method: "POST",
          headers: expect.any(Headers),
        },
      );
    });

    expect(await screen.findByText(/saved to answer library/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 answer saved/i)).toBeInTheDocument();
  });

  it("shows checklist warnings and lets the student mark an attachment ready", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
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
              extractionStatus: "completed",
              deadline: "2026-04-15",
              questions: [
                {
                  id: "question-1",
                  prompt: "Tell us about your leadership in STEM.",
                  type: "essay",
                  focusArea: "leadership_service",
                  orderIndex: 0,
                  draft: {
                    id: "draft-1",
                    content: "Generated draft content",
                    grounding: ["leadershipRoles"],
                  },
                },
                {
                  id: "question-2",
                  prompt: "Upload your transcript.",
                  type: "attachment",
                  focusArea: "attachment",
                  orderIndex: 1,
                  attachmentReady: false,
                },
              ],
              checklist: {
                totalItems: 2,
                completedItems: 1,
                missingAttachmentPrompts: ["Upload your transcript."],
                items: [
                  {
                    questionId: "question-1",
                    prompt: "Tell us about your leadership in STEM.",
                    kind: "response",
                    status: "complete",
                  },
                  {
                    questionId: "question-2",
                    prompt: "Upload your transcript.",
                    kind: "attachment",
                    status: "missing",
                  },
                ],
              },
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            checklist: {
              questionId: "question-2",
              status: "ready",
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ApplicationDetailPanel, { applicationId: "app-1" }));

    expect(await screen.findByText(/1 of 2 application items ready/i)).toBeInTheDocument();
    expect(await screen.findByText(/missing attachment/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/upload your transcript/i)).length).toBe(2);

    fireEvent.click(
      screen.getByRole("button", { name: /mark attachment ready for question 2/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/questions/question-2/checklist", {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({ completed: true }),
      });
    });

    expect(await screen.findByText(/2 of 2 application items ready/i)).toBeInTheDocument();
    expect(await screen.findByText(/all required items are ready/i)).toBeInTheDocument();
  });

  it("shows response limits and revision warnings for over-limit drafts", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
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
              extractionStatus: "completed",
              deadline: "2026-04-15",
              questions: [
                {
                  id: "question-1",
                  prompt: "In 5 words or less, describe your leadership style.",
                  type: "short_answer",
                  focusArea: "leadership_service",
                  orderIndex: 0,
                  wordLimit: 5,
                  characterLimit: null,
                  draft: {
                    id: "draft-1",
                    content:
                      "Thoughtful collaborative service-driven leadership style for community teams",
                    grounding: ["leadershipRoles"],
                  },
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
            draft: {
              id: "draft-1",
              questionId: "question-1",
              content: "Thoughtful collaborative service-driven leadership style",
              grounding: ["leadershipRoles"],
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ApplicationDetailPanel, { applicationId: "app-1" }));

    expect(await screen.findByText(/target: 5 words max/i)).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/needs revision before submission/i)).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText(/above the 5-word limit/i)).toBeInTheDocument();
    expect(await screen.findByText(/0 of 1 application items ready/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /shorten to fit limit/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/questions/question-1/rewrite", {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({ action: "shorten_to_limit" }),
      });
    });

    expect(
      await screen.findByText(/thoughtful collaborative service-driven leadership style/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/1 of 1 application items ready/i)).toBeInTheDocument();
  });

  it("shows follow-up questions when more profile context is needed before drafting", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
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
              extractionStatus: "completed",
              deadline: "2026-04-15",
              questions: [
                {
                  id: "question-1",
                  prompt: "Tell us about your leadership in STEM.",
                  type: "essay",
                  focusArea: "leadership_service",
                  orderIndex: 0,
                  draft: null,
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
            needsMoreInfo: true,
            followUpQuestions: [
              "What is one specific activity, project, or leadership example this answer should use?",
              "What result or impact came from that experience?",
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            question: {
              id: "question-1",
              followUpAnswers: [
                "I led our robotics intake redesign project.",
                "It improved match consistency and helped newer teammates contribute.",
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            draft: {
              id: "draft-1",
              questionId: "question-1",
              content:
                "I led our robotics intake redesign project and helped newer teammates contribute more consistently during competition season.",
              grounding: ["applicationFollowUpAnswers"],
            },
          }),
          { status: 200 },
        ),
      );

    render(React.createElement(ApplicationDetailPanel, { applicationId: "app-1" }));

    fireEvent.click(
      await screen.findByRole("button", { name: /generate draft for question 1/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/questions/question-1/draft", {
        method: "POST",
        headers: expect.any(Headers),
      });
    });

    expect(await screen.findByText(/need one more pass from you first/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/specific activity, project, or leadership example/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/what result or impact came from that experience/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/answer 1/i), {
      target: { value: "I led our robotics intake redesign project." },
    });
    fireEvent.change(screen.getByLabelText(/answer 2/i), {
      target: {
        value: "It improved match consistency and helped newer teammates contribute.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /save follow-up details/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/questions/question-1/context", {
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({
          followUpAnswers: [
            "I led our robotics intake redesign project.",
            "It improved match consistency and helped newer teammates contribute.",
          ],
        }),
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /generate draft for question 1/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/questions/question-1/draft", {
        method: "POST",
        headers: expect.any(Headers),
      });
    });

    expect(await screen.findByText(/robotics intake redesign project/i)).toBeInTheDocument();
    expect(await screen.findByText(/applicationFollowUpAnswers/i)).toBeInTheDocument();
  });
});
