"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ReusableAnswerSuggestion } from "@/lib/scholarships/application-schema";

export function ReusableAnswerLibraryPanel() {
  const [answers, setAnswers] = useState<ReusableAnswerSuggestion[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAnswers() {
      try {
        const response = await apiFetch("/api/reusable-answers");
        const body = await response.json();

        if (!mounted) return;
        if (!response.ok) {
          setError(body.error || "Could not load reusable answers");
          return;
        }

        setAnswers(body.reusableAnswers || []);
      } catch {
        if (mounted) {
          setError("Could not load reusable answers");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnswers();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="card section">
        <p className="status-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="card section">
      <div className="form-header">
        <div>
          <p className="eyebrow">Reusable Answer Library</p>
          <h2>Keep the responses worth reusing close at hand.</h2>
        </div>
      </div>

      {loading ? (
        <p className="hero-copy">Loading reusable answers...</p>
      ) : answers.length === 0 ? (
        <p className="hero-copy">
          No reusable answers saved yet. Generate a draft inside a scholarship
          workspace, then save it to the library.
        </p>
      ) : (
        <div className="workspace-list">
          {answers.map((answer) => (
            <article key={answer.id} className="workspace-card">
              <div className="workspace-card-main">
                <p className="eyebrow">Saved answer</p>
                <h3 className="workspace-title">{answer.prompt}</h3>
                <div className="draft-card">
                  <p className="draft-copy">{answer.content}</p>
                  <p className="draft-grounding">
                    Grounded in {answer.grounding.join(", ")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
