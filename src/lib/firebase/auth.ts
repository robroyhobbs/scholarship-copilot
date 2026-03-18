import type { StudentUserContext } from "@/lib/auth/user-context";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export function getBearerTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export async function verifyFirebaseUserFromRequest(
  request: Request,
): Promise<StudentUserContext | null> {
  const token = getBearerTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
  return {
    id: decoded.uid,
    email: decoded.email ?? null,
  };
}
