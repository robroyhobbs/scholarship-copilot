"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import {
  createEmptyStudentProfile,
  getStudentProfileCompletion,
  type StudentProfileInput,
} from "@/lib/profile/student-profile";

interface JourneySnapshot {
  profile: StudentProfileInput;
  applicationCount: number;
  answerCount: number;
}

function getRecommendation(snapshot: JourneySnapshot) {
  const completion = getStudentProfileCompletion(snapshot.profile);

  if (completion.percentComplete < 65) {
    return {
      href: "/onboarding",
      label: "Finish your profile first",
      detail: "Drafts get more specific once the core academic and story details are saved.",
    };
  }

  if (snapshot.applicationCount === 0) {
    return {
      href: "/scholarships",
      label: "Start your first scholarship workspace",
      detail: "Bring in one scholarship form so the app can extract the actual prompts.",
    };
  }

  if (snapshot.answerCount === 0) {
    return {
      href: "/scholarships",
      label: "Draft your first answer",
      detail: "Saving one strong answer makes the next application meaningfully faster.",
    };
  }

  return {
    href: "/library",
    label: "Review your answer library",
    detail: "Your best drafts are now reusable. Tighten them before the next deadline hits.",
  };
}

export function StudentJourneyCard() {
  const [snapshot, setSnapshot] = useState<JourneySnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const [profileResponse, applicationResponse, answerResponse] =
          await Promise.all([
            apiFetch("/api/profile"),
            apiFetch("/api/applications"),
            apiFetch("/api/reusable-answers"),
          ]);

        if (
          !profileResponse.ok ||
          !applicationResponse.ok ||
          !answerResponse.ok
        ) {
          throw new Error("Could not load journey status");
        }

        const [profileBody, applicationBody, answerBody] = await Promise.all([
          profileResponse.json(),
          applicationResponse.json(),
          answerResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        setSnapshot({
          profile: profileBody.profile ?? createEmptyStudentProfile(),
          applicationCount: applicationBody.applications?.length ?? 0,
          answerCount: answerBody.reusableAnswers?.length ?? 0,
        });
        setStatus("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setStatus("error");
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(() => {
    return getStudentProfileCompletion(
      snapshot?.profile ?? createEmptyStudentProfile(),
    );
  }, [snapshot]);

  const recommendation = snapshot ? getRecommendation(snapshot) : null;

  return (
    <section className="card section journey-card">
      <div className="form-header">
        <div>
          <p className="eyebrow">Next Best Move</p>
          <h2>Your next best move.</h2>
          <p className="hero-copy journey-copy">
            The fastest students do this in order: save the profile, open a real
            scholarship workspace, then keep the best answers in the library.
          </p>
        </div>
        <div className="progress-chip" aria-live="polite">
          {completion.percentComplete}% profile ready
        </div>
      </div>

      <div className="journey-grid">
        <article className="journey-step">
          <strong>Profile</strong>
          <p>
            {completion.completedFields}/{completion.totalFields} profile details
            saved
          </p>
        </article>
        <article className="journey-step">
          <strong>Scholarships</strong>
          <p>{snapshot?.applicationCount ?? 0} active workspaces</p>
        </article>
        <article className="journey-step">
          <strong>Answer Library</strong>
          <p>{snapshot?.answerCount ?? 0} saved answers</p>
        </article>
      </div>

      <div className="journey-recommendation">
        {status === "loading" ? (
          <p className="status-note">Checking your workspace status...</p>
        ) : null}
        {status === "error" ? (
          <>
            <p className="status-error">
              Could not load your workspace status right now.
            </p>
            <Link className="primary-link" href="/onboarding">
              Start with your profile
            </Link>
          </>
        ) : null}
        {status === "ready" && recommendation ? (
          <>
            <p className="status-note">{recommendation.detail}</p>
            <Link className="primary-link" href={recommendation.href}>
              {recommendation.label}
            </Link>
          </>
        ) : null}
      </div>
    </section>
  );
}
