"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { ensureFirebaseClientSession } from "@/lib/firebase/client-auth";
import type { ScholarshipApplicationSummary } from "@/lib/scholarships/application-schema";

interface ApplicationCardState extends ScholarshipApplicationSummary {}

const emptyDraft = {
  title: "",
  sponsorName: "",
  sourceText: "",
};

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function ScholarshipWorkspacePanel() {
  const [applications, setApplications] = useState<ApplicationCardState[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const sourceWordCount = countWords(draft.sourceText);
  const hasTitle = draft.title.trim().length > 0;
  const hasSubstantialText = sourceWordCount >= 12;
  const intakeReady = hasTitle && hasSubstantialText;

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      try {
        await ensureFirebaseClientSession();

        if (!mounted) return;
        setAuthReady(true);
      } catch {
        if (!mounted) return;
        setAuthError("Could not start your secure workspace session");
        setLoading(false);
      }
    }

    void loadAuth();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    let mounted = true;

    async function loadApplications() {
      try {
        const response = await apiFetch("/api/applications");
        const body = await response.json();
        if (!mounted) return;

        if (!response.ok) {
          setErrorMessage(body.error || "Could not load scholarship workspaces");
          return;
        }

        setApplications(body.applications || []);
      } catch {
        if (mounted) {
          setErrorMessage("Could not load scholarship workspaces");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      mounted = false;
    };
  }, [authReady]);

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authReady) {
      setErrorMessage("Still connecting your secure workspace");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await apiFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          sponsorName: draft.sponsorName,
          sourceType: "paste",
          sourceText: draft.sourceText,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.error || "Could not create scholarship workspace");
        return;
      }

      setApplications((current) => [body.application, ...current]);
      setDraft(emptyDraft);
      setStatusMessage("Scholarship workspace created");
    } catch {
      setErrorMessage("Could not create scholarship workspace");
    } finally {
      setSaving(false);
    }
  }

  async function handleExtract(applicationId: string) {
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await apiFetch(`/api/applications/${applicationId}/extract`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.error || "Could not extract scholarship questions");
        return;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                extractionStatus: "completed",
                deadline: body.deadline,
                questionCount: body.questionCount,
              }
            : application,
        ),
      );
      setStatusMessage("Scholarship questions extracted");
    } catch {
      setErrorMessage("Could not extract scholarship questions");
    }
  }

  async function handleSeedDemo() {
    if (!authReady) {
      setErrorMessage("Still connecting your secure workspace");
      return;
    }

    setSeedingDemo(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await apiFetch("/api/demo-seed", {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.error || "Could not load demo workspace");
        return;
      }

      setApplications(body.applications || []);
      setStatusMessage("Demo workspace ready");
    } catch {
      setErrorMessage("Could not load demo workspace");
    } finally {
      setSeedingDemo(false);
    }
  }

  return (
    <div className="workspace-shell">
      <section className="card section">
        <div className="form-header">
          <div>
            <p className="eyebrow">New Workspace</p>
            <h2>Start with one scholarship and turn it into a draftable workspace.</h2>
          </div>
        </div>

        <div className="mini-guide" aria-label="Workspace steps">
          <span className="mini-step">1. Paste the scholarship text</span>
          <span className="mini-step">2. Extract real prompts</span>
          <span className="mini-step">3. Draft from your saved profile</span>
        </div>

        <form className="form-shell" onSubmit={handleCreateWorkspace}>
          {!authReady && !authError ? (
            <p className="status-note">Connecting your secure workspace...</p>
          ) : null}
          {authError ? <p className="status-error">{authError}</p> : null}

          <section className="intake-desk">
            <div className="intake-desk-header">
              <div className="profile-planner-copy">
                <p className="eyebrow">Intake Desk</p>
                <h3>Before you create the workspace</h3>
                <p className="status-note">
                  Bring over the real scholarship text: overview, essay or short-answer
                  prompts, deadlines, and attachments. This intake is what the extraction
                  and drafting flow will trust later.
                </p>
              </div>
              <div className="intake-desk-callout">
                <p className="eyebrow">What To Paste Here</p>
                <p className="status-note">
                  Full prompt text beats summaries. If the scholarship has a special angle,
                  include that language directly.
                </p>
              </div>
            </div>
            <div className="journey-grid workspace-summary-grid">
              <article className="journey-step">
                <strong>Title</strong>
                <p>{hasTitle ? "Ready to create" : "Missing a scholarship title"}</p>
              </article>
              <article className="journey-step">
                <strong>Source Text</strong>
                <p>
                  {hasSubstantialText
                    ? "Scholarship text looks substantial enough to extract"
                    : "Paste the full scholarship text"}
                </p>
              </article>
              <article className="journey-step">
                <strong>Word Count</strong>
                <p>{sourceWordCount} words pasted</p>
              </article>
              <article className="journey-step">
                <strong>Next Step</strong>
                <p>{intakeReady ? "Create the workspace" : "Finish the intake above"}</p>
              </article>
            </div>
          </section>

          <div className="form-grid">
            <label className="field">
              <span>Scholarship title</span>
              <input
                aria-label="Scholarship title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Sponsor</span>
              <input
                aria-label="Sponsor"
                value={draft.sponsorName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sponsorName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field field-span">
              <span>Application text</span>
              <textarea
                aria-label="Application text"
                rows={7}
                value={draft.sourceText}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sourceText: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              className="primary-link button-reset"
              type="submit"
              disabled={!authReady || Boolean(authError)}
            >
              {saving ? "Creating..." : "Create workspace"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleSeedDemo()}
              disabled={!authReady || Boolean(authError) || seedingDemo}
            >
              {seedingDemo ? "Loading demo..." : "Load demo data"}
            </button>
            {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
            {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="card section">
        <div className="form-header">
          <div>
            <p className="eyebrow">Current Workspaces</p>
            <h2>Keep each scholarship organized from raw prompt to final review.</h2>
          </div>
        </div>

        {!authReady && !authError ? (
          <p className="hero-copy">Waiting for secure workspace access...</p>
        ) : loading ? (
          <p className="hero-copy">Loading scholarship workspaces...</p>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <p className="hero-copy">
              No scholarship workspaces yet. Start with one live prompt above,
              then extract the questions to open your first draft workflow.
            </p>
          </div>
        ) : (
          <div className="workspace-list">
            {applications.map((application) => (
              <article className="workspace-card" key={application.id}>
                <div>
                  <p className="eyebrow">{application.sponsorName || "Scholarship"}</p>
                  <h3 className="workspace-title">{application.title}</h3>
                  <p className="workspace-meta">
                    {application.extractionStatus === "completed"
                      ? "Ready for drafting"
                      : "Needs extraction"}
                  </p>
                  <p className="workspace-meta">
                    {application.questionCount
                      ? `${application.questionCount} questions extracted`
                      : "Questions still need to be extracted"}
                  </p>
                  {application.deadline ? (
                    <p className="workspace-meta">Deadline {application.deadline}</p>
                  ) : null}
                </div>

                <div className="workspace-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => handleExtract(application.id)}
                  >
                    Extract questions
                  </button>
                  <Link
                    className="primary-link workspace-link"
                    href={`/scholarships/${application.id}`}
                  >
                    Open workspace
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
