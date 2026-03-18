import { beforeEach, describe, expect, it, vi } from "vitest";

const { versionDocs, getFirebaseAdminDb } = vi.hoisted(() => ({
  versionDocs: new Map<string, Record<string, unknown>>(),
  getFirebaseAdminDb: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminDb,
}));

import {
  createApplicationVersionSnapshot,
  listApplicationVersions,
} from "@/lib/versions/application-version-repository";

describe("application version repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    versionDocs.clear();

    function createQuery(filters: Array<{ field: string; value: unknown }>) {
      return {
        where(field: string, _operator: string, value: unknown) {
          return createQuery([...filters, { field, value }]);
        },
        async get() {
          const docs = Array.from(versionDocs.entries())
            .filter(([, data]) =>
              filters.every((filter) => data[filter.field] === filter.value),
            )
            .map(([id, data]) => ({
              id,
              exists: true,
              data: () => data,
            }));

          return { docs };
        },
      };
    }

    getFirebaseAdminDb.mockReturnValue({
      collection(name: string) {
        if (name !== "applicationVersions") {
          throw new Error(`Unexpected collection ${name}`);
        }

        return {
          doc(id: string) {
            return {
              async set(data: Record<string, unknown>) {
                versionDocs.set(id, {
                  ...(versionDocs.get(id) ?? {}),
                  ...data,
                });
              },
            };
          },
          where(field: string, _operator: string, value: unknown) {
            return createQuery([{ field, value }]);
          },
        };
      },
    });
  });

  it("stores a redacted packet instead of raw sensitive content", async () => {
    const version = await createApplicationVersionSnapshot("user-1", "app-1", {
      title: "STEM Leaders Scholarship",
      sponsorName: "Bright Futures Foundation",
      deadline: "2026-04-15",
      readyToSubmit: false,
      missingItems: [],
      privacyWarnings: ["Contains an email address"],
      sections: [
        {
          questionId: "question-1",
          kind: "response",
          heading: "Tell us how to reach you.",
          body: "Email me at maya@example.com",
          redactedBody: "Email me at [redacted email]",
        },
      ],
    });

    expect(version.applicationId).toBe("app-1");
    const stored = Array.from(versionDocs.values())[0];
    expect(stored).toEqual(
      expect.objectContaining({
        packet: expect.objectContaining({
          sections: [
            expect.objectContaining({
              body: "Email me at [redacted email]",
              redactedBody: "Email me at [redacted email]",
            }),
          ],
        }),
      }),
    );
  });

  it("lists saved snapshots from firestore", async () => {
    versionDocs.set("version-1", {
      userId: "user-1",
      applicationId: "app-1",
      createdAt: "2026-03-16T20:00:00.000Z",
      readyToSubmit: false,
      sectionCount: 1,
    });

    await expect(listApplicationVersions("user-1", "app-1")).resolves.toEqual([
      {
        id: "version-1",
        applicationId: "app-1",
        createdAt: "2026-03-16T20:00:00.000Z",
        readyToSubmit: false,
        sectionCount: 1,
      },
    ]);
  });
});
