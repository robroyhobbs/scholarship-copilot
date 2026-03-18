import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type { ApplicationExportPacket } from "@/lib/export/application-export";

export interface ApplicationVersionSummary {
  id: string;
  applicationId: string;
  createdAt: string;
  readyToSubmit: boolean;
  sectionCount: number;
}

interface ApplicationVersionRow {
  id: string;
  applicationId: string;
  createdAt: string;
  readyToSubmit: boolean;
  sectionCount: number;
}

function normalizeVersion(row: ApplicationVersionRow): ApplicationVersionSummary {
  return {
    id: row.id,
    applicationId: row.applicationId,
    createdAt: row.createdAt,
    readyToSubmit: row.readyToSubmit,
    sectionCount: row.sectionCount,
  };
}

function sanitizePacketForSnapshot(packet: ApplicationExportPacket) {
  return {
    ...packet,
    sections: packet.sections.map((section) => ({
      ...section,
      body: section.redactedBody,
    })),
  };
}

function getVersionCollection() {
  return getFirebaseAdminDb().collection("applicationVersions");
}

export async function listApplicationVersions(
  userId: string,
  applicationId: string,
): Promise<ApplicationVersionSummary[]> {
  const snapshot = await getVersionCollection()
    .where("userId", "==", userId)
    .where("applicationId", "==", applicationId)
    .get();

  return snapshot.docs
    .map((doc) =>
      normalizeVersion({
        id: doc.id,
        ...(doc.data() as Omit<ApplicationVersionRow, "id">),
      }),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createApplicationVersionSnapshot(
  userId: string,
  applicationId: string,
  packet: ApplicationExportPacket,
): Promise<ApplicationVersionSummary> {
  const sanitizedPacket = sanitizePacketForSnapshot(packet);
  const versionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await getVersionCollection().doc(versionId).set({
    userId,
    applicationId,
    createdAt,
    readyToSubmit: sanitizedPacket.readyToSubmit,
    sectionCount: sanitizedPacket.sections.length,
    packet: sanitizedPacket,
  });

  return normalizeVersion({
    id: versionId,
    applicationId,
    createdAt,
    readyToSubmit: sanitizedPacket.readyToSubmit,
    sectionCount: sanitizedPacket.sections.length,
  });
}
