# Scholarship Service Technical Plan

Date: 2026-03-15
Working name: `Scholarship Copilot`

## Executive Summary

The scholarship product should launch as a standalone Next.js + Supabase service with Inngest-backed async document processing. It should selectively copy platform and ingestion modules from `intentwin`, but keep its own schema, routes, prompts, and UI.

The key technical choice is to keep the product single-user first:
- no organization-heavy model
- student-owned records
- lightweight roles
- no dependency on the procurement intelligence service

## Standalone Service Recommendation

Recommendation: **fully separate repo**, initialized from a lightweight copy of the `intentwin` platform skeleton.

Why not a new app inside the current repo:
- current repo is not structured as a monorepo
- student-service schema and routes will drift quickly from procurement flows
- deployment and privacy separation are easier in a dedicated repo

Why not shared packages first:
- it slows the first build
- the actual reusable surface is still small and concrete
- copy-first is safer; extract shared packages later if duplication becomes real

## Proposed High-Level Architecture

### Frontend

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- authenticated dashboard with:
  - onboarding
  - student profile
  - asset library
  - scholarship workspaces
  - draft editor

### Backend

- Next.js route handlers for v1
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Inngest for async processing

### AI Layer

- extraction pipeline for scholarship forms
- retrieval pipeline over student assets and reusable answers
- grounded draft generation for question responses
- optional review/scoring pass

## Recommended Repo Structure

```text
src/
  app/
    (auth)/
    (dashboard)/
      onboarding/
      profile/
      assets/
      scholarships/
      applications/
      settings/
    api/
      profile/
      assets/
      scholarships/
      applications/
      extraction/
      drafts/
      reusable-answers/
      health/
      inngest/
  components/
    onboarding/
    profile/
    assets/
    applications/
    review/
    ui/
  inngest/
    functions/
      process-student-asset.ts
      extract-scholarship-application.ts
      generate-application-draft.ts
      score-draft-response.ts
  lib/
    supabase/
    api/
    security/
    observability/
    documents/
    ai/
      prompts/
      pipeline/
      retrieval/
    versioning/
    progress/
  types/
supabase/
  migrations/
```

## Domain Model

### Core Entities

1. `student_profiles`
- one row per student
- canonical student truth

2. `student_profile_entries`
- typed profile facts or narrative entries
- supports structured and flexible L1 storage

3. `student_assets`
- uploaded files like resume, transcript, prior essays

4. `student_asset_chunks`
- parsed/searchable chunks for retrieval

5. `scholarships`
- extracted scholarship metadata

6. `scholarship_applications`
- one workspace per student per scholarship

7. `application_questions`
- essay prompts, short answers, attachment requirements

8. `draft_responses`
- generated and edited responses for each question

9. `reusable_answers`
- reusable short responses and essay fragments

10. `submission_checklists`
- final required tasks and file readiness

11. `application_versions`
- snapshots at meaningful milestones

### IntentBid Table Mapping

- `company_context` -> `student_profile_entries`
- `documents` -> `student_assets`
- `document_chunks` -> `student_asset_chunks`
- `proposals` -> `scholarship_applications`
- `proposal_requirements` -> `application_questions` + `application_requirements`
- `proposal_versions` -> `application_versions`
- `evidence_library` -> `reusable_answers` and verified student examples

## Auth Model

V1 should use:
- Supabase Auth
- one primary user type: `student`
- optional admin/operator role for support only

Do not port:
- organization invites
- multi-seat org workflows
- team role granularity

## Storage Model

Buckets:
- `student-assets`
- `application-uploads`
- `application-exports`

Asset types:
- `resume`
- `transcript`
- `essay`
- `award`
- `activity-sheet`
- `reference-note`
- `scholarship-form`
- `other`

## Document Ingestion Flow

### Student Asset Processing

1. upload file
2. create `student_assets` record
3. enqueue async job
4. parse document text
5. chunk content
6. generate embeddings if enabled
7. mark asset processed

### Scholarship Form Extraction

1. upload/paste application
2. create application workspace
3. run extraction job
4. store:
   - title
   - sponsor
   - deadline
   - eligibility constraints
   - questions
   - required attachments
5. run preflight against student profile

## AI Workflow

### Deterministic Responsibilities

- auth
- storage
- file type validation
- parsing status
- question state tracking
- deadline handling
- checklist completeness
- version snapshots

### AI Responsibilities

- scholarship prompt extraction from messy documents
- optional metadata normalization
- context-to-question matching
- draft generation
- reusable-answer suggestion
- draft quality feedback

### Prompt Architecture

Use separate prompts for:
1. scholarship extraction
2. profile gap detection
3. question-to-context mapping
4. first-draft generation
5. rewrite/shorten/strengthen
6. final quality review

Do not reuse procurement prompts directly.
Reuse only the structural pattern from `src/lib/ai/prompts/**`.

### Grounding Strategy

Every draft should be grounded in:
- student profile facts
- extracted student asset content
- prior approved reusable answers
- the exact scholarship prompt text

Each draft generation should produce structured metadata:
- source profile fields used
- source assets used
- prior reusable answers consulted
- confidence level

### Anti-Hallucination Rules

1. never invent GPA, awards, dates, service hours, or achievements
2. when a required fact is missing, emit a missing-context prompt
3. mark uncertain text for user review
4. keep generated claims tied to explicit student evidence

## Reusable Answer Strategy

Store reusable answers with metadata:
- question type
- themes
- scholarship category
- length
- tone
- source application
- manually approved flag

Reuse flow:
1. retrieve semantically similar prior answers
2. show suggested reusable answers
3. adapt only with explicit scholarship prompt grounding
4. avoid verbatim reuse unless student chooses it

## What To Copy vs Rewrite

### Copy First

- `src/lib/supabase/{client,server,admin}.ts`
- `src/lib/api/response.ts`
- `src/lib/supabase/auth-api.ts`
- `src/lib/documents/**`
- `src/inngest/functions/process-document.ts`
- `src/lib/security/**`
- `src/lib/observability/**`

### Rewrite

- proposal API routes
- proposal schema
- procurement prompts
- intelligence client
- org/team management
- proposal generation orchestrators

## Operational Concerns

- transcripts and financial-need essays are sensitive
- logs must redact uploaded content and personal identifiers
- storage access must be student-scoped
- support tooling should avoid broad raw-content exposure

## Fastest Path To V1

1. copy platform and document infrastructure from IntentBid
2. create student schema and simple auth
3. ship onboarding + asset upload
4. ship scholarship extraction
5. ship grounded draft generation for short answers and essays
6. add reusable-answer library after first real application loop works
