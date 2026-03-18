import Link from "next/link";
import { StudentJourneyCard } from "@/components/chrome/student-journey-card";

const highlights = [
  {
    title: "Profile once",
    body: "Keep your academics, leadership, and story bank ready for every deadline after this one.",
  },
  {
    title: "Extract the real ask",
    body: "Turn scholarship text into visible prompts, limits, deadlines, and attachments.",
  },
  {
    title: "Rewrite without starting over",
    body: "Fix weak or over-limit answers in-place instead of rebuilding the draft from scratch.",
  },
];

const studentSteps = [
  {
    title: "1. Save your story once",
    body: "Capture the academic details, goals, and proof points that show up again and again.",
  },
  {
    title: "2. Drop in the scholarship",
    body: "Paste the form or upload the source material so the app can pull out the actual questions and deadline.",
  },
  {
    title: "3. Draft, review, and reuse",
    body: "Generate grounded answers, save the strong ones, and keep building a smarter answer library over time.",
  },
];

const studentWins = [
  "One reusable profile instead of retyping the same story",
  "Clear checklist for missing answers and attachments",
  "A growing answer library you can adapt for the next scholarship",
];

export default function HomePage() {
  return (
    <main className="shell">
      <div className="page-wrap">
        <section className="hero">
          <div className="card hero-main">
            <p className="eyebrow">Student Scholarship Workspace</p>
            <h1 className="hero-title">Scholarship Copilot</h1>
            <p className="hero-copy">
              Finish stronger scholarship applications without starting over.
              Build your student profile once, turn forms into clear prompts,
              and draft from the real experiences you have already earned.
            </p>
            <div className="signal-grid" aria-label="Service highlights">
              {highlights.map((item) => (
                <article key={item.title} className="signal-card">
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="hero-actions">
              <Link className="primary-link" href="/onboarding">
                Start your profile
              </Link>
              <Link className="secondary-link" href="/scholarships">
                Open application workspace
              </Link>
            </div>
          </div>

          <aside className="card hero-side">
            <p className="eyebrow">What You Leave With</p>
            <h2>A cleaner scholarship process that keeps getting faster.</h2>
            <p>
              This is built for repeat applications, not one-off essay writing.
              The goal is simple: less busywork, better first drafts, and more
              confidence when deadlines pile up.
            </p>
            <ul className="clean-list">
              {studentWins.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <StudentJourneyCard />

        <section className="card section">
          <p className="eyebrow">How It Works</p>
          <h2>Three moves, one repeatable system.</h2>
          <div className="section-grid">
            {studentSteps.map((slice) => (
              <article className="stat stat-spotlight" key={slice.title}>
                <strong>{slice.title}</strong>
                <p>{slice.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card section section-band">
          <div className="section-split">
            <div>
              <p className="eyebrow">Start Here</p>
              <h2>Best first move: fill out the profile before touching a scholarship.</h2>
              <p>
                The draft quality gets better when the app already knows your
                goals, leadership, service, and major story threads.
              </p>
            </div>
            <div className="stack-actions">
              <Link className="primary-link" href="/onboarding">
                Build your profile
              </Link>
              <Link className="secondary-link" href="/library">
                View answer library
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
