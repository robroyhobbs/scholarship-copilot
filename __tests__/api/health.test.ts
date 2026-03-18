import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reports missing launch envs honestly", async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      service: "scholarship-copilot",
      phase: "phase-5",
      launchReady: false,
      checks: {
        authEnv: {
          firebaseApiKey: false,
          firebaseAuthDomain: false,
          firebaseProjectId: false,
          firebaseAppId: false,
        },
        profileDataEnv: {
          firebaseProjectId: false,
        },
        assetStorageEnv: {
          firebaseStorageBucket: false,
        },
        workspaceDataEnv: {
          firebaseProjectId: false,
        },
        workflowDataEnv: {
          firebaseProjectId: false,
        },
        legacyFallbackEnv: {
          supabaseUrl: false,
          supabaseAnonKey: false,
          supabaseServiceRoleKey: false,
        },
        providers: {
          auth: "unconfigured",
          profileStore: "unconfigured",
          assetStore: "unconfigured",
          workspaceStore: "unconfigured",
          draftStore: "unconfigured",
          reusableAnswerStore: "unconfigured",
          checklistStore: "unconfigured",
          versionStore: "unconfigured",
          legacyFallback: "disabled",
          migrationMode: "incomplete",
        },
      },
    });
  });

  it("reports launch readiness when required envs exist", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "firebase-api-key";
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "gen-lang-client-0405402450.firebaseapp.com";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "gen-lang-client-0405402450";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "firebase-app-id";
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "gen-lang-client-0405402450.firebasestorage.app";
    process.env.FIREBASE_ADMIN_PROJECT_ID = "gen-lang-client-0405402450";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.launchReady).toBe(true);
    expect(body.checks.authEnv).toEqual({
      firebaseApiKey: true,
      firebaseAuthDomain: true,
      firebaseProjectId: true,
      firebaseAppId: true,
    });
    expect(body.checks.profileDataEnv).toEqual({
      firebaseProjectId: true,
    });
    expect(body.checks.assetStorageEnv).toEqual({
      firebaseStorageBucket: true,
    });
    expect(body.checks.workspaceDataEnv).toEqual({
      firebaseProjectId: true,
    });
    expect(body.checks.workflowDataEnv).toEqual({
      firebaseProjectId: true,
    });
    expect(body.checks.legacyFallbackEnv).toEqual({
      supabaseUrl: false,
      supabaseAnonKey: false,
      supabaseServiceRoleKey: false,
    });
    expect(body.checks.providers).toEqual({
      auth: "firebase",
      profileStore: "firestore",
      assetStore: "firebase-storage-firestore-metadata",
      workspaceStore: "firestore",
      draftStore: "firestore",
      reusableAnswerStore: "firestore",
      checklistStore: "firestore",
      versionStore: "firestore",
      legacyFallback: "disabled",
      migrationMode: "google-native",
    });
  });
});
