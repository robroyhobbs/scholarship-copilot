# Scholarship Service Reuse Audit

Date: 2026-03-15
Source repos reviewed:
- `/Users/robroyhobbs/intentwin`
- `/Users/robroyhobbs/intentbid-intelligence`

## Executive Summary

The new scholarship product should not be built inside the existing IntentBid app. The right approach is a new standalone service that selectively copies proven modules from `intentwin` and ignores most procurement-specific domains.

The highest-value reuse is not proposal logic. It is:
- Supabase auth/client wiring
- API response and access-check patterns
- document upload + parse + async processing
- L1 context and preflight gap patterns
- versioning and progress primitives
- onboarding and settings UX structure

The `intentbid-intelligence` service is mostly irrelevant for v1. It is a procurement data service and should not be pulled into the scholarship product unless a later scholarship-discovery feature needs external opportunity aggregation.

## Recommended Repo Strategy

Recommendation: **fully separate repo**, seeded from IntentBid patterns and copied modules.

Why:
- student data should be operationally separate from B2B proposal data
- the domain language is different enough that shared tables and routes will create drag
- a standalone repo avoids accidental reuse of procurement assumptions and enterprise workflow complexity
- copying a small set of proven modules is faster than extracting a monorepo package layer right now

Secondary option:
- create shared packages later only after 2-3 modules are proven stable across both products

## Reuse As-Is

These modules are strong candidates to copy with minimal changes.

### Platform and Auth

1. `src/lib/supabase/client.ts`
2. `src/lib/supabase/server.ts`
3. `src/lib/supabase/admin.ts`
4. `src/lib/api/response.ts`
5. `src/lib/supabase/auth-api.ts`

Why:
- these are clean platform primitives
- they already support authenticated route handlers, admin access, and structured responses
- the `getUserContext` pattern is reusable even if it becomes `student workspace` instead of `organization`

Migration notes:
- replace `organization_id` and `team_id` assumptions with student-owned records
- simplify role model to `student` and optional `admin`
- remove proposal-specific route wrappers from `response.ts`

### Document Parsing

1. `src/lib/documents/parser.ts`
2. `src/lib/documents/chunker.ts`
3. `src/lib/documents/pipeline.ts`
4. `src/lib/documents/parsers/pdf.ts`
5. `src/lib/documents/parsers/docx.ts`
6. `src/lib/documents/parsers/text.ts`
7. `src/app/api/documents/upload/route.ts`
8. `src/inngest/functions/process-document.ts`

Why:
- scholarship applications will also need document upload, text extraction, chunking, and async processing
- the current pipeline already handles storage, DB records, parse status, preview text, and chunk persistence

Migration notes:
- rename `knowledge-base-documents` storage bucket
- change document types from proposal-oriented categories to student asset / scholarship asset categories
- remove organization plan-limit checks or replace with student quota checks

### Security, Validation, and Operational Basics

1. `middleware.ts`
2. `src/lib/security/**`
3. `src/lib/rate-limit/**`
4. `src/lib/observability/**`
5. `src/lib/utils/logger`

Why:
- these are platform concerns, not procurement concerns
- student uploads and PII need the same or stricter protections

Migration notes:
- tune rate limits for student flows
- review log redaction for student data like GPA, financial need, essays, and transcripts

### Versioning and Progress

1. `src/lib/versioning/create-version.ts`
2. `src/lib/progress/task-progress`

Why:
- repeated scholarship applications benefit from snapshots, save points, and long-running progress states

Migration notes:
- rename proposal versions to application draft versions
- trigger versions on `draft_generated`, `student_edited`, `pre_submit_export`

## Reuse With Adaptation

These are valuable patterns, but not direct carry-overs.

### L1 Context System

1. `src/lib/ai/pipeline/fetch-l1-context.ts`
2. `src/lib/ai/pipeline/context.ts`
3. `src/lib/ai/pipeline/build-pipeline-context.ts`
4. `supabase/migrations/00001_baseline.sql` tables:
   - `company_context`
   - `product_contexts`
   - `evidence_library`
   - `team_members`

Why:
- the L1 concept maps directly to durable student truth
- this is the strongest product reuse idea in the repo

How to adapt:
- `company_context` -> `student_profile_entries`
- `product_contexts` -> remove entirely or replace with `student_strengths` / `student_goals`
- `evidence_library` -> `student_assets` and `reusable_answers`
- `team_members` -> not needed; replace with `references` only if required

### Preflight Gap Detection

1. `src/lib/ai/pipeline/preflight.ts`
2. `src/components/preflight/readiness-report.tsx`
3. `src/components/preflight/targeted-upload.tsx`
4. `src/components/preflight/review-mode-sidebar.tsx`

Why:
- this is one of the best reusable user-value patterns in the app
- scholarship workflows need the same “what’s missing before you submit” guidance

How to adapt:
- detect missing GPA, service history, leadership examples, financial need context, transcript, recommendation data
- use targeted upload requests for transcript, resume, prior essays, awards, volunteer history

### Intake and Extraction

1. `src/app/api/intake/extract/route.ts`
2. `src/app/api/intake/fetch-url/route.ts`
3. `src/lib/ai/prompts/extract-intake*`
4. `src/lib/utils/extract-json`

Why:
- the scholarship product also needs structured extraction from uploaded forms and pasted application text

How to adapt:
- extract `essay prompts`, `short answers`, `eligibility constraints`, `deadlines`, `required attachments`
- strip procurement-specific fields like contract value, NAICS, set-asides, incumbent, win strategy

### Onboarding and Profile Management UI

1. `src/app/(dashboard)/onboarding/page.tsx`
2. `src/app/(dashboard)/onboarding/_components/*`
3. `src/app/(dashboard)/settings/company/_components/profile-tab.tsx`
4. `src/app/(dashboard)/settings/company/_components/team-members-tab.tsx`
5. `src/app/(dashboard)/settings/company/_components/certifications-tab.tsx`

Why:
- the stepwise onboarding and editable settings tabs fit the scholarship product well

How to adapt:
- company onboarding becomes student onboarding
- team member resume upload pattern becomes student asset upload
- certification inputs become awards, extracurriculars, and student achievements

### AI Orchestration

1. `src/inngest/functions/generate-proposal.ts`
2. `src/inngest/functions/generate-single-section.ts`
3. `src/inngest/functions/quality-review.ts`
4. `src/lib/ai/pipeline/generate-single-section.ts`
5. `src/lib/ai/pipeline/retrieval.ts`
6. `src/lib/ai/pipeline/differentiators.ts`

Why:
- the structure of staged generation, retrieval, and review is valuable

How to adapt:
- proposal sections become application questions or essay responses
- “differentiators” become student themes, strengths, and story arcs
- quality review stays useful, but must optimize for sincerity, specificity, and prompt fit rather than sales persuasion

## Do Not Reuse

These areas either do not fit or would bring expensive baggage.

### Procurement-Specific Domain Logic

1. `src/lib/intelligence/**`
2. `src/app/(dashboard)/intelligence/**`
3. `src/app/api/intelligence/**`
4. `intentbid-intelligence/src/**`

Why:
- federal/local procurement data models are unrelated to scholarship completion
- introducing a second service for v1 would be unnecessary architecture

### Proposal and Review Workflow Complexity

1. `src/components/review-workflow/**`
2. `src/components/compliance/**`
3. `src/app/api/proposals/**`
4. `src/lib/review/**`
5. `src/lib/proposal-core/**`

Why:
- color-team review, compliance boards, and section-by-section proposal orchestration are too heavy for a student product

### Billing and B2B Org Complexity

1. `src/app/api/stripe/**`
2. `src/app/api/org/**`
3. `src/app/(dashboard)/settings/company/_components/organization-*`
4. `src/lib/auth/user-roles.ts`

Why:
- organizations, invitations, and enterprise permissions are not the right v1 abstraction
- keep the scholarship product single-user first

### Marketing and Domain Copy

1. public landing pages under `src/app/(public)/**`
2. `brand/**`
3. procurement-specific prompts in `src/lib/ai/prompts/**` that assume RFPs, evaluators, competitors, compliance matrices

Why:
- the scholarship product needs its own voice, not repurposed B2B messaging

## First Modules to Port

Port first:
1. `src/lib/supabase/{client,server,admin}.ts`
2. `src/lib/api/response.ts`
3. `src/lib/supabase/auth-api.ts` as a simplified student context layer
4. `src/lib/documents/{parser,chunker,pipeline}.ts`
5. `src/inngest/functions/process-document.ts`
6. onboarding/settings UI patterns from `src/app/(dashboard)/onboarding/**`

Do not port first:
1. proposal generation orchestrators
2. bid scoring
3. procurement intelligence
4. color-team review
5. enterprise org management

## Conclusion

IntentBid provides a strong platform and document-processing foundation. The scholarship product should borrow those foundations, but it must become its own service with its own schema, UI, and AI prompts. The fastest route is selective copying into a separate repo, not deeper coupling to the current app.
