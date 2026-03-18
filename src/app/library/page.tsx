import { ReusableAnswerLibraryPanel } from "@/components/reusable-answers/reusable-answer-library-panel";

export default function LibraryPage() {
  return (
    <main className="shell">
      <div className="page-wrap">
        <section className="card hero-main">
          <p className="eyebrow">Answer Library</p>
          <h1 className="hero-title" style={{ maxWidth: "11ch" }}>
            Reuse your strongest answers.
          </h1>
          <p className="hero-copy">
            Save the responses that actually sound like you. This library helps
            the next scholarship start from real material instead of a blank
            page and a rushed deadline.
          </p>
        </section>

        <ReusableAnswerLibraryPanel />
      </div>
    </main>
  );
}
