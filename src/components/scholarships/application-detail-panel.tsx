"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ScholarshipApplicationDetail } from "@/lib/scholarships/application-schema";
import { buildSubmissionChecklist } from "@/lib/checklist/submission-checklist";

export function ApplicationDetailPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  function formatCount(count: number, singular: string, plural: string = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function formatFocusAreaLabel(focusArea: ScholarshipApplicationDetail["questions"][number]["focusArea"]) {
    return focusArea
      .split("_")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");
  }

  function withChecklist(detail: ScholarshipApplicationDetail) {
    return {
      ...detail,
      checklist: buildSubmissionChecklist(detail.questions),
    };
  }

  const [application, setApplication] =
    useState<ScholarshipApplicationDetail | null>(null);
  const [error, setError] = useState("");
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [savingReusableQuestionId, setSavingReusableQuestionId] = useState<string | null>(
    null,
  );
  const [savingChecklistQuestionId, setSavingChecklistQuestionId] = useState<string | null>(
    null,
  );
  const [savingContextQuestionId, setSavingContextQuestionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      try {
        const response = await apiFetch(`/api/applications/${applicationId}`);
        const body = await response.json();

        if (!mounted) return;
        if (!response.ok) {
          setError(body.error || "Could not load scholarship workspace");
          return;
        }

        setApplication(withChecklist(body.application));
      } catch {
        if (mounted) {
          setError("Could not load scholarship workspace");
        }
      }
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  if (error) {
    return (
      <section className="card section">
        <p className="status-error">{error}</p>
      </section>
    );
  }

  if (!application) {
    return (
      <section className="card section">
        <p className="hero-copy">Loading scholarship workspace...</p>
      </section>
    );
  }

  const draftedCount = application.questions.filter((question) => question.draft).length;
  const savedCount = application.questions.filter(
    (question) => question.savedToLibrary,
  ).length;
  const attachmentQuestions = application.questions.filter(
    (question) => question.type === "attachment",
  );
  const readyAttachmentCount = attachmentQuestions.filter(
    (question) => question.attachmentReady,
  ).length;

  async function handleGenerateDraft(questionId: string) {
    setPendingQuestionId(questionId);
    setError("");

    try {
      const response = await apiFetch(`/api/questions/${questionId}/draft`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not generate draft");
        return;
      }

      if (body.needsMoreInfo) {
        setApplication((current) =>
          current
            ? withChecklist({
                ...current,
                questions: current.questions.map((question) =>
                  question.id === questionId
                    ? {
                        ...question,
                        followUpQuestions: body.followUpQuestions || [],
                        followUpAnswers:
                          question.followUpAnswers && question.followUpAnswers.length > 0
                            ? question.followUpAnswers
                            : (body.followUpQuestions || []).map(() => ""),
                      }
                    : question,
                ),
              })
            : current,
        );
        return;
      }

      setApplication((current) =>
        current
          ? withChecklist({
              ...current,
              questions: current.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      draft: body.draft,
                      followUpQuestions: [],
                      followUpAnswers: question.followUpAnswers ?? [],
                    }
                  : question,
              ),
            })
          : current,
      );
    } catch {
      setError("Could not generate draft");
    } finally {
      setPendingQuestionId(null);
    }
  }

  async function handleSaveReusableAnswer(questionId: string) {
    setSavingReusableQuestionId(questionId);
    setError("");

    try {
      const response = await apiFetch(`/api/questions/${questionId}/reusable-answer`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not save reusable answer");
        return;
      }

      setApplication((current) =>
        current
          ? withChecklist({
              ...current,
              questions: current.questions.map((question) =>
                question.id === questionId
                  ? { ...question, savedToLibrary: true }
                  : question,
              ),
            })
          : current,
      );
    } catch {
      setError("Could not save reusable answer");
    } finally {
      setSavingReusableQuestionId(null);
    }
  }

  async function handleChecklistUpdate(questionId: string, completed: boolean) {
    setSavingChecklistQuestionId(questionId);
    setError("");

    try {
      const response = await apiFetch(`/api/questions/${questionId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not update checklist");
        return;
      }

      setApplication((current) => {
        if (!current) return current;

        const questions = current.questions.map((question) =>
          question.id === questionId
            ? { ...question, attachmentReady: body.checklist.status === "ready" }
            : question,
        );

        return {
          ...current,
          questions,
          checklist: buildSubmissionChecklist(questions),
        };
      });
    } catch {
      setError("Could not update checklist");
    } finally {
      setSavingChecklistQuestionId(null);
    }
  }

  async function handleSaveFollowUpAnswers(questionId: string, followUpAnswers: string[]) {
    setSavingContextQuestionId(questionId);
    setError("");

    try {
      const response = await apiFetch(`/api/questions/${questionId}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpAnswers }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not save follow-up details");
        return;
      }

      setApplication((current) =>
        current
          ? withChecklist({
              ...current,
              questions: current.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      followUpAnswers: body.question.followUpAnswers || [],
                    }
                  : question,
              ),
            })
          : current,
      );
    } catch {
      setError("Could not save follow-up details");
    } finally {
      setSavingContextQuestionId(null);
    }
  }

  return (
    <section className="card section">
      <p className="eyebrow">{application.sponsorName || "Scholarship"}</p>
      <h2>{application.title}</h2>
      <p className="hero-copy">
        {application.deadline
          ? `Deadline ${application.deadline}`
          : "No deadline extracted yet"}
      </p>
      <div className="mini-guide" aria-label="Workspace next steps">
        <span className="mini-step">Draft the response questions first</span>
        <span className="mini-step">Save the answers worth reusing</span>
        <span className="mini-step">Mark attachments only when they are actually ready</span>
      </div>
      <div className="journey-grid workspace-summary-grid">
        <article className="journey-step">
          <strong>Prompts</strong>
          <p>
            {formatCount(
              application.questions.length,
              "extracted prompt",
              "extracted prompts",
            )}
          </p>
        </article>
        <article className="journey-step">
          <strong>Drafts</strong>
          <p>{formatCount(draftedCount, "answer drafted", "answers drafted")}</p>
        </article>
        <article className="journey-step">
          <strong>Library</strong>
          <p>{formatCount(savedCount, "answer saved", "answers saved")}</p>
        </article>
        <article className="journey-step">
          <strong>Attachments</strong>
          <p>
            {attachmentQuestions.length
              ? `${readyAttachmentCount}/${attachmentQuestions.length} ready`
              : "No attachment prompts"}
          </p>
        </article>
      </div>
      <div className="checklist-panel">
        <p className="eyebrow">Completion Checklist</p>
        <p className="checklist-summary">
          {application.checklist.completedItems} of {application.checklist.totalItems} application items ready
        </p>
        {application.checklist.missingAttachmentPrompts.length ? (
          <div className="checklist-warning">
            <p className="checklist-warning-title">Missing attachment</p>
            <ul className="clean-list">
              {application.checklist.missingAttachmentPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="status-message">All required items are ready.</p>
        )}
        <Link className="secondary-link inline-link" href={`/scholarships/${applicationId}/review`}>
          Review export packet
        </Link>
      </div>

      <div className="workspace-list">
        {application.questions.length === 0 ? (
          <p className="hero-copy">
            No structured questions have been extracted yet for this scholarship.
          </p>
        ) : (
          application.questions.map((question) => (
            <article key={question.id} className="workspace-card">
              <div className="workspace-card-main">
                <p className="eyebrow">{question.type.replace("_", " ")}</p>
                <h3 className="workspace-title">{question.prompt}</h3>
                {question.focusArea !== "general" ? (
                  <p className="status-note">
                    Focus area: {formatFocusAreaLabel(question.focusArea)}
                  </p>
                ) : null}
                {question.draft ? (
                  <div className="draft-card">
                    <p className="draft-copy">{question.draft.content}</p>
                    <p className="draft-grounding">
                      Grounded in {question.draft.grounding.join(", ")}
                    </p>
                  </div>
                ) : null}
                {question.suggestions?.length ? (
                  <div className="suggestion-list">
                    {question.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="suggestion-card">
                        <p className="eyebrow">Reusable library match</p>
                        <p className="suggestion-prompt">{suggestion.prompt}</p>
                        <p className="suggestion-copy">{suggestion.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {question.followUpQuestions?.length ? (
                  <div className="checklist-warning">
                    <p className="checklist-warning-title">
                      Need one more pass from you first
                    </p>
                    <ul className="clean-list">
                      {question.followUpQuestions.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                    <div className="form-grid">
                      {question.followUpQuestions.map((prompt, index) => (
                        <label className="field field-span" key={prompt}>
                          <span>Answer {index + 1}</span>
                          <textarea
                            rows={3}
                            value={question.followUpAnswers?.[index] || ""}
                            onChange={(event) =>
                              setApplication((current) =>
                                current
                                  ? withChecklist({
                                      ...current,
                                      questions: current.questions.map((entry) =>
                                        entry.id === question.id
                                          ? {
                                              ...entry,
                                              followUpAnswers: (
                                                entry.followUpAnswers ??
                                                question.followUpQuestions!.map(() => "")
                                              ).map((value, answerIndex) =>
                                                answerIndex === index
                                                  ? event.target.value
                                                  : value,
                                              ),
                                            }
                                          : entry,
                                      ),
                                    })
                                  : current,
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        handleSaveFollowUpAnswers(
                          question.id,
                          question.followUpAnswers ?? [],
                        )
                      }
                    >
                      {savingContextQuestionId === question.id
                        ? "Saving..."
                        : "Save follow-up details"}
                    </button>
                  </div>
                ) : null}
                {question.type === "attachment" ? (
                  <p className="attachment-status">
                    {question.attachmentReady
                      ? "Attachment marked ready"
                      : "Attachment still missing"}
                  </p>
                ) : null}
              </div>
              <div className="workspace-actions">
                <button
                  className="secondary-button"
                  type="button"
                  aria-label={`Generate draft for question ${question.orderIndex + 1}`}
                  onClick={() => handleGenerateDraft(question.id)}
                >
                  {pendingQuestionId === question.id
                    ? "Generating..."
                    : "Draft answer"}
                </button>
                {question.draft ? (
                  <button
                    className="secondary-button"
                    type="button"
                    aria-label={`Save draft ${question.orderIndex + 1} to reusable library`}
                    onClick={() => handleSaveReusableAnswer(question.id)}
                  >
                    {savingReusableQuestionId === question.id
                      ? "Saving..."
                      : question.savedToLibrary
                        ? "Saved to answer library"
                        : "Save to answer library"}
                  </button>
                ) : null}
                {question.type === "attachment" ? (
                  <button
                    className="secondary-button"
                    type="button"
                    aria-label={`Mark attachment ready for question ${question.orderIndex + 1}`}
                    onClick={() =>
                      handleChecklistUpdate(question.id, !question.attachmentReady)
                    }
                  >
                    {savingChecklistQuestionId === question.id
                      ? "Saving..."
                      : question.attachmentReady
                        ? "Mark attachment missing"
                        : "Mark attachment ready"}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
