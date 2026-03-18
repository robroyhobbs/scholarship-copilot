"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApplicationExportPacket } from "@/lib/export/application-export";
import type { ApplicationReviewResult } from "@/lib/review/application-review-service";
import type { ApplicationVersionSummary } from "@/lib/versions/application-version-repository";

export function ExportPacketPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  function formatCount(count: number, singular: string, plural: string = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  const [packet, setPacket] = useState<ApplicationExportPacket | null>(null);
  const [versions, setVersions] = useState<ApplicationVersionSummary[]>([]);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [showRedactedCopy, setShowRedactedCopy] = useState(false);
  const [review, setReview] = useState<ApplicationReviewResult | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPacket() {
      try {
        const [packetResponse, versionsResponse] = await Promise.all([
          apiFetch(`/api/applications/${applicationId}/export`),
          apiFetch(`/api/applications/${applicationId}/versions`),
        ]);
        const body = await packetResponse.json();
        const versionsBody = await versionsResponse.json();

        if (!mounted) return;
        if (!packetResponse.ok) {
          setError(body.error || "Could not load review packet");
          return;
        }

        setPacket(body.packet);
        if (versionsResponse.ok) {
          setVersions(versionsBody.versions || []);
        }
      } catch {
        if (mounted) {
          setError("Could not load review packet");
        }
      }
    }

    loadPacket();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  async function handleSaveSnapshot() {
    setSavingSnapshot(true);
    setSaveStatus("");
    setCopyStatus("");
    setError("");

    try {
      const response = await apiFetch(`/api/applications/${applicationId}/versions`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not save snapshot");
        return;
      }

      setVersions((current) => [body.version, ...current]);
      setSaveStatus("Snapshot saved");
    } catch {
      setError("Could not save snapshot");
    } finally {
      setSavingSnapshot(false);
    }
  }

  async function handleCopyRedactedVersion() {
    if (!packet || typeof navigator === "undefined" || !navigator.clipboard) {
      setError("Clipboard is not available");
      return;
    }

    setCopyStatus("");
    setError("");

    const text = packet.sections
      .map((section) => `${section.heading}\n${section.redactedBody}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Redacted copy ready");
    } catch {
      setError("Could not copy redacted version");
    }
  }

  async function handleRunReview() {
    setReviewing(true);
    setReviewStatus("");
    setError("");

    try {
      const response = await apiFetch(`/api/applications/${applicationId}/review`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || "Could not run AI review");
        return;
      }

      setReview(body.review);
      setReviewStatus("AI review ready");
    } catch {
      setError("Could not run AI review");
    } finally {
      setReviewing(false);
    }
  }

  if (error) {
    return (
      <section className="card section">
        <p className="status-error">{error}</p>
      </section>
    );
  }

  if (!packet) {
    return (
      <section className="card section">
        <p className="hero-copy">Loading review packet...</p>
      </section>
    );
  }

  const responseSections = packet.sections.filter(
    (section) => section.kind === "response",
  ).length;
  const attachmentSections = packet.sections.filter(
    (section) => section.kind === "attachment",
  ).length;

  return (
    <section className="card section">
      <div className="submission-packet-header">
        <div>
          <p className="eyebrow">Submission Packet</p>
          <h2>{packet.title}</h2>
          <p className="hero-copy">
            {packet.deadline ? `Deadline ${packet.deadline}` : "No deadline extracted yet"}
          </p>
        </div>
        <div className="submission-packet-side">
          <p className="eyebrow">{packet.sponsorName || "Scholarship"}</p>
          <p className="status-note">
            Private-detail review, packet readiness, and snapshot control all live here.
          </p>
        </div>
      </div>
      <div className="mini-guide" aria-label="Review flow">
        <span className="mini-step">Check readiness first</span>
        <span className="mini-step">Redact private details if needed</span>
        <span className="mini-step">Save a clean snapshot before submitting</span>
      </div>
      <div className="journey-grid workspace-summary-grid">
        <article className="journey-step">
          <strong>Responses</strong>
          <p>{formatCount(responseSections, "response ready", "responses ready")}</p>
        </article>
        <article className="journey-step">
          <strong>Attachments</strong>
          <p>
            {formatCount(
              attachmentSections,
              "attachment ready",
              "attachments ready",
            )}
          </p>
        </article>
        <article className="journey-step">
          <strong>Missing</strong>
          <p>{formatCount(packet.missingItems.length, "missing item")}</p>
        </article>
        <article className="journey-step">
          <strong>Privacy</strong>
          <p>{formatCount(packet.privacyWarnings.length, "privacy flag")}</p>
        </article>
      </div>

      <div className="checklist-panel">
        <p className="eyebrow">Submission Review</p>
        <p className="checklist-summary">
          {packet.readyToSubmit ? "Submission-ready" : "Needs one more pass"}
        </p>
        <p className="status-note">
          {packet.readyToSubmit
            ? "Everything required for this packet is present and no privacy warnings are blocking submission."
            : "Use this page to close missing items, clear privacy warnings, and save the version you actually want to send."}
        </p>
        {packet.privacyWarnings.length ? (
          <div className="checklist-warning">
            <p className="checklist-warning-title">Privacy review needed</p>
            <ul className="clean-list">
              {packet.privacyWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {packet.missingItems.length ? (
          <div className="checklist-warning">
            <p className="checklist-warning-title">Still missing</p>
            <ul className="clean-list">
              {packet.missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {packet.privacyWarnings.length ? (
          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setShowRedactedCopy((current) => !current)}
            >
              {showRedactedCopy ? "Show original copy" : "Show redacted copy"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleCopyRedactedVersion}
            >
              Copy redacted version
            </button>
          </div>
        ) : null}
        <button
          className="secondary-button inline-link"
          type="button"
          onClick={handleSaveSnapshot}
        >
          {savingSnapshot ? "Saving..." : "Save snapshot"}
        </button>
        <button
          className="secondary-button inline-link"
          type="button"
          onClick={handleRunReview}
        >
          {reviewing ? "Reviewing..." : "Run AI review"}
        </button>
        {saveStatus ? <p className="status-message">{saveStatus}</p> : null}
        {copyStatus ? <p className="status-message">{copyStatus}</p> : null}
        {reviewStatus ? <p className="status-message">{reviewStatus}</p> : null}
      </div>

      {review ? (
        <section className="version-history">
          <p className="eyebrow">AI Review</p>
          <p className="checklist-summary">{review.summary}</p>
          <p className="status-note">Reviewed with {review.model}</p>
          <div className="journey-grid workspace-summary-grid">
            <article className="journey-step">
              <strong>Strengths</strong>
              <p>{formatCount(review.strengths.length, "strength")}</p>
            </article>
            <article className="journey-step">
              <strong>Risks</strong>
              <p>{formatCount(review.risks.length, "risk")}</p>
            </article>
            <article className="journey-step">
              <strong>Priorities</strong>
              <p>{formatCount(review.revisionPriorities.length, "revision priority")}</p>
            </article>
          </div>
          {review.strengths.length ? (
            <div className="checklist-warning">
              <p className="checklist-warning-title">Strengths to keep</p>
              <ul className="clean-list">
                {review.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.risks.length ? (
            <div className="checklist-warning">
              <p className="checklist-warning-title">Risks to fix</p>
              <ul className="clean-list">
                {review.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.revisionPriorities.length ? (
            <div className="checklist-warning">
              <p className="checklist-warning-title">Revision priorities</p>
              <ul className="clean-list">
                {review.revisionPriorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="version-history">
        <p className="eyebrow">Version History</p>
        {versions.length === 0 ? (
          <p className="status-message">No saved snapshots yet.</p>
        ) : (
          <div className="workspace-list">
            {versions.map((version) => (
              <article className="workspace-card" key={version.id}>
                <div className="workspace-card-main">
                  <p className="workspace-meta">
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                  <p className="draft-copy">
                    {version.sectionCount} section{version.sectionCount === 1 ? "" : "s"} saved
                  </p>
                  <p className="draft-grounding">
                    {version.readyToSubmit ? "Ready to submit" : "Draft snapshot"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="version-history">
        <p className="eyebrow">Final Handoff Copy</p>
        <p className="status-note">
          This is the packet the student can copy, review, and compare against saved snapshots.
        </p>
      </section>

      <div className="workspace-list">
        {packet.sections.map((section) => (
          <article className="workspace-card" key={section.questionId}>
            <div className="workspace-card-main">
              <p className="eyebrow">{section.kind === "attachment" ? "Attachment" : "Response"}</p>
              <h3 className="workspace-title">{section.heading}</h3>
              <div className="draft-card export-copy-card">
                <p className="draft-copy">
                  {showRedactedCopy ? section.redactedBody : section.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
