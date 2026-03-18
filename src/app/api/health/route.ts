import { ok } from "@/lib/api/response";

export async function GET() {
  const firebaseProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authEnv = {
    firebaseApiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    firebaseAuthDomain: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    firebaseProjectId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    firebaseAppId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
  const profileDataEnv = {
    firebaseProjectId: Boolean(firebaseProjectId),
  };
  const assetStorageEnv = {
    firebaseStorageBucket: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  };
  const workspaceDataEnv = {
    firebaseProjectId: Boolean(firebaseProjectId),
  };
  const workflowDataEnv = {
    firebaseProjectId: Boolean(firebaseProjectId),
  };
  const legacyFallbackEnv = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const authReady = Object.values(authEnv).every(Boolean);
  const profileStoreReady = Object.values(profileDataEnv).every(Boolean);
  const assetStoreReady = Object.values(assetStorageEnv).every(Boolean);
  const workspaceStoreReady = Object.values(workspaceDataEnv).every(Boolean);
  const workflowStoreReady = Object.values(workflowDataEnv).every(Boolean);
  const legacyFallbackReady = Object.values(legacyFallbackEnv).every(Boolean);

  const checks = {
    authEnv,
    profileDataEnv,
    assetStorageEnv,
    workspaceDataEnv,
    workflowDataEnv,
    legacyFallbackEnv,
    providers: {
      auth: authReady ? "firebase" : "unconfigured",
      profileStore: profileStoreReady ? "firestore" : "unconfigured",
      assetStore: assetStoreReady
        ? "firebase-storage-firestore-metadata"
        : "unconfigured",
      workspaceStore: workspaceStoreReady ? "firestore" : "unconfigured",
      draftStore: workflowStoreReady ? "firestore" : "unconfigured",
      reusableAnswerStore: workflowStoreReady ? "firestore" : "unconfigured",
      checklistStore: workflowStoreReady ? "firestore" : "unconfigured",
      versionStore: workflowStoreReady ? "firestore" : "unconfigured",
      legacyFallback: legacyFallbackReady ? "supabase" : "disabled",
      migrationMode:
        authReady &&
        profileStoreReady &&
        assetStoreReady &&
        workspaceStoreReady &&
        workflowStoreReady
          ? "google-native"
          : authReady ||
              profileStoreReady ||
              assetStoreReady ||
              workspaceStoreReady ||
              workflowStoreReady
            ? "partial"
            : "incomplete",
    },
  };

  return ok({
    ok: true,
    service: "scholarship-copilot",
    phase: "phase-5",
    launchReady:
      authReady &&
      profileStoreReady &&
      assetStoreReady &&
      workspaceStoreReady &&
      workflowStoreReady,
    checks,
  });
}
