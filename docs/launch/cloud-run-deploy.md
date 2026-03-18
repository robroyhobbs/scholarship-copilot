# Cloud Run Deploy

Date: 2026-03-16

## Target

- project: `gen-lang-client-0405402450`
- service: `scholarship-copilot`
- region: `us-central1`
- memory: `1Gi`
- runtime service account: `firebase-adminsdk-fbsvc@gen-lang-client-0405402450.iam.gserviceaccount.com`
- public access: `--no-invoker-iam-check`

## Required Runtime Environment

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0405402450`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gen-lang-client-0405402450-scholarship-copilot`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID=gen-lang-client-0405402450`

## Deploy Command

```bash
gcloud run deploy scholarship-copilot \
  --source . \
  --region us-central1 \
  --project gen-lang-client-0405402450 \
  --memory 1Gi \
  --service-account firebase-adminsdk-fbsvc@gen-lang-client-0405402450.iam.gserviceaccount.com \
  --set-env-vars \
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gen-lang-client-0405402450.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0405402450,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gen-lang-client-0405402450-scholarship-copilot,\
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID,\
FIREBASE_ADMIN_PROJECT_ID=gen-lang-client-0405402450

gcloud run services update scholarship-copilot \
  --region us-central1 \
  --project gen-lang-client-0405402450 \
  --no-invoker-iam-check
```

## Post-Deploy Checks

1. Open `/api/health`
2. Confirm `launchReady: true`
3. Run one real user path:
   - save profile
   - create scholarship workspace
   - extract prompts
   - generate draft
   - upload one asset

## Notes

- This repo uses `.gcloudignore` so local env files and `node_modules` are not uploaded.
- Cloud Run is the safer first deployment target for this app because the current stack is Next.js 16 and a standard container deployment avoids framework-support ambiguity.
- This project's org policy blocked `allUsers`/`allAuthenticatedUsers` IAM bindings, so public access is enabled via `--no-invoker-iam-check` instead of public invoker IAM members.
