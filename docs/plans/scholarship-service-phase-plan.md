# Scholarship Service Phase Plan

Date: 2026-03-15

## Executive Summary

This build should start as a standalone scholarship application service with a copy-first strategy from IntentBid. The first valuable slice is not full AI automation. It is a working student workspace that captures profile truth, ingests scholarship applications, and produces grounded first drafts from that truth.

## Phase 0: Architecture and Repo Setup

Goal:
- lock repo strategy
- create standalone service skeleton
- port safe shared platform modules

Deliverables:
- new repo created for scholarship service
- baseline Next.js app running
- Supabase wired
- Inngest wired
- copied platform modules integrated:
  - Supabase clients
  - auth helpers
  - API response helpers
  - security/observability basics

Tests:
- auth smoke test
- health route test
- protected route access test

Exit criteria:
- student can sign in
- protected dashboard loads
- environment boots locally

## Phase 1: Auth and Reusable Student Profile

Goal:
- create the durable student truth layer

Features:
- account creation and login
- student profile onboarding
- editable profile workspace
- structured profile entries

Initial schema:
- `student_profiles`
- `student_profile_entries`

Tests:
- profile create/update happy path
- unauthorized access blocked
- profile isolation by user
- profile validation rules

Exit criteria:
- a student can complete onboarding
- a student can return and edit profile later

## Phase 2: Student Assets and Scholarship Ingestion

Goal:
- make uploads and extraction work

Features:
- upload student assets
- upload/paste scholarship application
- parse document text
- extract prompts, deadlines, requirements

Initial schema additions:
- `student_assets`
- `student_asset_chunks`
- `scholarships`
- `scholarship_applications`
- `application_questions`

Tests:
- upload validation
- parse pipeline success/failure states
- extraction route behavior
- question extraction persistence

Exit criteria:
- one scholarship workspace can be created from a file or pasted text
- extracted questions are visible in UI

## Phase 3: Draft Generation and Reusable Answer Library

Goal:
- turn extracted questions into grounded drafts

Features:
- question-to-context mapping
- first-draft generation
- section-level regeneration
- reusable answer suggestions
- save approved answers for future reuse

Schema additions:
- `draft_responses`
- `reusable_answers`

Tests:
- draft generation contract
- missing-context fallback
- reusable-answer retrieval
- no cross-user data leakage

Exit criteria:
- students can draft at least one strong answer from profile + assets
- approved answers can be reused on a later application

## Phase 4: Review, Checklist, and Export

Goal:
- make application completion operationally useful

Features:
- completion checklist
- missing attachments warnings
- deadline display
- review states
- export/copy-friendly output
- version snapshots

Schema additions:
- `submission_checklists`
- `application_versions`

Tests:
- checklist completeness
- version snapshot creation
- export formatting

Exit criteria:
- students can see what is missing and what is complete
- students can export final answers cleanly

## Phase 5: Quality, Privacy, and Ops Hardening

Goal:
- make the system trustworthy

Features:
- stronger audit logging
- PII redaction review
- rate limiting refinement
- support/admin guardrails
- prompt quality tuning

Tests:
- security and privacy regression tests
- upload abuse limits
- draft grounding verification
- operational error-path tests

Exit criteria:
- service is safe for broader pilot use

## First Implementation Slice

The first real coding slice should be:
1. create standalone repo
2. port auth/platform modules
3. implement student profile schema and onboarding
4. implement student asset upload and processing
5. create scholarship application workspace shell

This slice matters because it creates the durable substrate for every later AI feature.

## Immediate Next Steps

1. Create the standalone repo.
2. Port the platform modules identified in the reuse audit.
3. Add the initial Supabase migration for:
   - `student_profiles`
   - `student_profile_entries`
   - `student_assets`
   - `scholarship_applications`
4. Build onboarding UI.
5. Build asset upload UI.
6. Add scholarship upload/paste route and workspace creation.
