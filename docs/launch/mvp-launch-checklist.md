# MVP Launch Checklist

Date: 2026-03-16

## Goal

Launch a usable student scholarship MVP with:
- onboarding
- asset upload
- scholarship workspace creation
- prompt extraction
- draft generation
- reusable answers
- checklist/review/export
- privacy and abuse guardrails

## Required Environment

Set these values before starting the app:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_ADMIN_PROJECT_ID`

Optional only for legacy fallback reads:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Quick readiness check:
- `GET /api/health`
- expect `launchReady: true`
- expect `checks.providers.migrationMode` to be `google-native`

## Required Google Setup

Confirm these are enabled in project `gen-lang-client-0405402450`:
- Firebase anonymous auth
- Firestore database
- Cloud Storage bucket `gen-lang-client-0405402450-scholarship-copilot`
- server-side credentials through ADC or Firebase admin service account env vars

## Release Commands

Run before launch:

```bash
npm test
npm run lint
npm run build
```

Run the app:

```bash
npm run dev
```

Cloud Run deploy target:
- service: `scholarship-copilot`
- region: `us-central1`

## Manual Smoke Path

1. Open `/onboarding`
2. Save a student profile
3. Upload a small `TXT`, `MD`, `DOCX`, or text-based `PDF`
4. Create a scholarship workspace from pasted text
5. Run extraction
6. Generate at least one draft
7. Save one reusable answer
8. Mark one attachment ready
9. Open the review/export page
10. Save a snapshot
11. Toggle redacted copy if privacy warnings appear

## Known MVP Constraints

- Rate limiting is in-process only. It protects a single app instance, not a distributed deployment.
- Privacy detection/redaction only covers obvious emails and phone numbers.
- File parsing is best-effort. Scanned or image-only PDFs can still fail extraction.
- Snapshot storage now saves redacted section bodies, but the live current workspace still shows original draft text until the student toggles redacted copy.
- No billing, admin moderation, or background job infrastructure is required for the MVP.

## Launch Decision

Launch today if all of these are true:
- `npm test` passes
- `npm run build` passes
- `/api/health` reports `launchReady: true`
- Firebase anonymous auth is enabled for the target project
- Firestore is available for profiles, workspaces, questions, drafts, reusable answers, checklists, and versions
- Firebase Storage bucket is configured for student asset uploads
- the manual smoke path succeeds for one real user account

## Post-Launch TODO

- Add the production custom domain after the first experience and onboarding polish pass is locked.
