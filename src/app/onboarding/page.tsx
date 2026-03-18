import { StudentProfileForm } from "@/components/onboarding/student-profile-form";
import { studentProfileSections } from "@/lib/profile/student-profile";

export default function OnboardingPage() {
  return (
    <main className="shell">
      <div className="page-wrap">
        <section className="hero">
          <article className="card hero-main onboarding-hero-main">
            <p className="eyebrow">Student Profile</p>
            <h1 className="hero-title" style={{ maxWidth: "14ch" }}>
              Build the reusable story once.
            </h1>
            <p className="hero-copy">
              Start with the details that make your applications specific:
              academics, goals, service, leadership, and the themes you want to
              come through in your writing.
            </p>
          </article>
          <article className="card hero-side onboarding-hero-side">
            <p className="eyebrow">Application Ingredients</p>
            <h2>Great scholarship writing rarely starts from scratch.</h2>
            <div className="hero-side-stack">
              <div className="hero-side-card">
                <strong>Proof</strong>
                <p>Activities, leadership, service, awards, and results.</p>
              </div>
              <div className="hero-side-card">
                <strong>Story</strong>
                <p>Background, turning points, and the moments you still remember clearly.</p>
              </div>
              <div className="hero-side-card">
                <strong>Direction</strong>
                <p>Academic interests, goals, and what you want scholarship support to unlock.</p>
              </div>
            </div>
          </article>
        </section>

        <StudentProfileForm />

        <section className="card section">
          <p className="eyebrow">Profile Sections</p>
          <h2>Four sections shape every draft that comes next.</h2>
          <div className="section-grid">
            {studentProfileSections.map((section) => {
              return (
                <article key={section.id} className="stat">
                  <strong>{section.label}</strong>
                  <p>{section.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
