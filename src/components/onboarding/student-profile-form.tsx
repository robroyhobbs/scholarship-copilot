"use client";

import { useMemo, useState } from "react";
import {
  academicYearOptions,
  createEmptyStudentProfile,
  getStudentProfileCompletion,
  type StudentProfileInput,
} from "@/lib/profile/student-profile";
import { apiFetch } from "@/lib/api/client";

interface StudentProfileFormProps {
  initialProfile?: StudentProfileInput;
}

function arrayValueToText(values: string[]) {
  return values.join("\n");
}

function textToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function StudentProfileForm({
  initialProfile = createEmptyStudentProfile(),
}: StudentProfileFormProps) {
  const [profile, setProfile] = useState<StudentProfileInput>(initialProfile);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const completion = useMemo(
    () => getStudentProfileCompletion(profile),
    [profile],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await apiFetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const body = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(body.error || "Could not save profile");
        return;
      }

      setProfile(body.profile);
      setStatus("saved");
      setMessage("Profile saved");
    } catch {
      setStatus("error");
      setMessage("Could not save profile");
    }
  }

  function updateArrayField(
    key:
      | "academicInterests"
      | "extracurriculars"
      | "leadershipRoles"
      | "volunteerWork"
      | "workExperience"
      | "awards"
      | "personalThemes"
      | "signatureStories",
    value: string,
  ) {
    setProfile((current) => ({
      ...current,
      [key]: textToArray(value),
    }));
  }

  return (
    <form className="card section form-shell" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Reusable Student Profile</p>
          <h2>Save the details every future scholarship can pull from.</h2>
        </div>
        <div className="progress-chip" aria-live="polite">
          {completion.completedFields}/{completion.totalFields} complete
        </div>
      </div>

      <div className="profile-planner">
        <div className="profile-planner-copy">
          <p className="eyebrow">Best First Pass</p>
          <p className="status-note">
            Fill the identity and academics sections first. That gives the app
            enough context to stop sounding generic on early drafts.
          </p>
        </div>
        <div className="profile-section-grid">
          {completion.sections.map((section) => (
            <article key={section.id} className="profile-section-card">
              <strong>{section.label}</strong>
              <p>
                {section.completedFields}/{section.totalFields} complete
              </p>
            </article>
          ))}
        </div>
      </div>

      <section className="evidence-bank" aria-label="Scholarship evidence bank">
        <div className="evidence-bank-copy">
          <p className="eyebrow">What strong applications usually need</p>
          <h3>Build a small bank of proof, not a giant autobiography.</h3>
        </div>
        <div className="evidence-bank-grid">
          <article className="evidence-card">
            <strong>Impact and leadership proof</strong>
            <p>Clubs, roles, service, work, awards, and what changed because you showed up.</p>
          </article>
          <article className="evidence-card">
            <strong>Story bank moments</strong>
            <p>One memory, challenge, person, or turning point you can reuse across many prompts.</p>
          </article>
          <article className="evidence-card">
            <strong>Academic fit and direction</strong>
            <p>What you want to study, why it matters, and where you want it to lead.</p>
          </article>
        </div>
      </section>

      <div className="profile-form-sections">
        <section className="profile-form-section">
          <div className="profile-form-section-header">
            <p className="eyebrow">Core Identity</p>
            <h3>The basics every application expects.</h3>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>First name</span>
              <input
                value={profile.firstName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Last name</span>
              <input
                value={profile.lastName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>School</span>
              <input
                value={profile.schoolName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    schoolName: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-section-header">
            <p className="eyebrow">Academic Profile</p>
            <h3>Show what you study now and what it is building toward.</h3>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Academic year</span>
              <select
                value={profile.academicYear}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    academicYear: event.target.value as StudentProfileInput["academicYear"],
                  }))
                }
              >
                {academicYearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>GPA</span>
              <input
                value={profile.gpa}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    gpa: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Intended major</span>
              <input
                value={profile.intendedMajor}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    intendedMajor: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field field-span">
              <span>Academic interests</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.academicInterests)}
                onChange={(event) =>
                  updateArrayField("academicInterests", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Career goal</span>
              <textarea
                rows={4}
                value={profile.careerGoal}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    careerGoal: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-section-header">
            <p className="eyebrow">Activity Highlights</p>
            <h3>Capture what you did, where you led, and who it helped.</h3>
          </div>
          <div className="form-grid">
            <label className="field field-span">
              <span>Activities and clubs</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.extracurriculars)}
                onChange={(event) =>
                  updateArrayField("extracurriculars", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Leadership roles</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.leadershipRoles)}
                onChange={(event) =>
                  updateArrayField("leadershipRoles", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Community involvement and service</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.volunteerWork)}
                onChange={(event) =>
                  updateArrayField("volunteerWork", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Work experience</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.workExperience)}
                onChange={(event) =>
                  updateArrayField("workExperience", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Awards and recognition</span>
              <textarea
                rows={4}
                value={arrayValueToText(profile.awards)}
                onChange={(event) => updateArrayField("awards", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-section-header">
            <p className="eyebrow">Story Material</p>
            <h3>Store the moments and context that make an essay sound like you.</h3>
          </div>
          <div className="form-grid">
            <label className="field field-span">
              <span>Personal themes</span>
              <textarea
                rows={3}
                value={arrayValueToText(profile.personalThemes)}
                onChange={(event) =>
                  updateArrayField("personalThemes", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Family or background context</span>
              <textarea
                rows={4}
                value={profile.familyBackground}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    familyBackground: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field field-span">
              <span>Challenges or adversity</span>
              <textarea
                rows={4}
                value={profile.challengesAdversity}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    challengesAdversity: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field field-span">
              <span>Financial need context</span>
              <textarea
                rows={4}
                value={profile.financialNeedContext}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    financialNeedContext: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field field-span">
              <span>Story bank</span>
              <textarea
                rows={5}
                value={arrayValueToText(profile.signatureStories)}
                onChange={(event) =>
                  updateArrayField("signatureStories", event.target.value)
                }
              />
            </label>

            <label className="field field-span">
              <span>Writing preferences</span>
              <textarea
                rows={3}
                value={profile.writingPreferences}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    writingPreferences: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>
      </div>

      <div className="form-actions">
        <button className="primary-link button-reset" type="submit">
          {status === "saving" ? "Saving..." : "Save profile"}
        </button>
        <p className="status-note">
          Start with the basics today. You can keep adding stronger details as
          your answer library grows.
        </p>
        {message ? (
          <p
            className={status === "error" ? "status-error" : "status-message"}
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
