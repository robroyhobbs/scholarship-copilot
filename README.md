# Scholarship Copilot

Standalone student scholarship application service.

## Purpose

Scholarship Copilot helps students:
- create reusable student context once
- upload scholarship applications and supporting materials
- extract prompts, deadlines, and requirements
- generate grounded first drafts
- reuse prior answers across repeated applications

## Why This Repo Exists

This product is intentionally separate from IntentBid.

It borrows proven platform and document-processing patterns from:
- `/Users/robroyhobbs/intentwin`

But it should not inherit:
- procurement terminology
- proposal-specific workflows
- enterprise org complexity
- dependency on the procurement intelligence service for v1

## Kickoff Docs

The initial planning set lives in [`docs/plans`](./docs/plans):
- `scholarship-service-product-spec.md`
- `scholarship-service-technical-plan.md`
- `scholarship-service-reuse-audit.md`
- `scholarship-service-phase-plan.md`

## Recommended First Build Slice

1. Auth and student profile onboarding
2. Student asset upload and parsing
3. Scholarship application workspace creation
4. Prompt extraction from uploaded scholarship forms

## Source Reuse Priority

Copy first from IntentBid:
- auth and request plumbing patterns
- API response helpers
- auth context helpers
- document upload and processing pipeline
- security and observability basics

Rewrite for this product:
- schema
- prompts
- UI
- application workflows
- review logic

## Status

MVP build is now feature-complete enough for a controlled launch.

## Launch

Current runtime mode:
- Firebase anonymous auth on the client
- Firestore for student profiles
- Cloud Storage plus Firestore metadata for student assets
- Firestore for scholarship workspaces and extracted questions
- Firestore for drafts, reusable answers, checklists, and versions
- Vertex AI for scholarship draft generation with deterministic fallback
- Supabase is optional legacy fallback only during migration cleanup

Required env vars:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `GOOGLE_CLOUD_LOCATION`
- `VERTEX_DRAFT_MODEL`
- `VERTEX_REVIEW_MODEL`

Current production bucket:
- `gen-lang-client-0405402450-scholarship-copilot`

Current Vertex defaults:
- draft generation: `gemini-2.5-flash`
- premium review target: `gemini-2.5-pro`

Optional legacy fallback env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Verification:

```bash
npm test
npm run lint
npm run build
```

Health check:
- `GET /api/health`
- expect `launchReady: true`
- current provider report should show `google-native`

Launch checklist:
- [`docs/launch/mvp-launch-checklist.md`](./docs/launch/mvp-launch-checklist.md)
- [`docs/launch/cloud-run-deploy.md`](./docs/launch/cloud-run-deploy.md)
