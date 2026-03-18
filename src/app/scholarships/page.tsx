import { ScholarshipWorkspacePanel } from "@/components/scholarships/scholarship-workspace-panel";

export default function ScholarshipsPage() {
  return (
    <main className="shell">
      <div className="page-wrap">
        <section className="card hero-main">
          <p className="eyebrow">Scholarship Workspace</p>
          <h1 className="hero-title" style={{ maxWidth: "12ch" }}>
            Turn a scholarship form into a working draft.
          </h1>
          <p className="hero-copy">
            Paste the prompt, extract the questions, then draft with your saved
            story. This is the place to move from raw scholarship text into a
            reviewable application packet.
          </p>
          <div className="pill-row">
            <span className="pill">1. Paste or upload</span>
            <span className="pill">2. Extract the prompts</span>
            <span className="pill">3. Draft and review</span>
          </div>
        </section>

        <ScholarshipWorkspacePanel />
      </div>
    </main>
  );
}
