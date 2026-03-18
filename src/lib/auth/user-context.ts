import { verifyFirebaseUserFromRequest } from "@/lib/firebase/auth";
import { createClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export interface StudentUserContext {
  id: string;
  email: string | null;
}

export async function getCurrentStudentUser(
  request?: Request,
): Promise<StudentUserContext | null> {
  if (request) {
    const firebaseUser = await verifyFirebaseUserFromRequest(request).catch(() => null);
    if (firebaseUser) {
      return firebaseUser;
    }
  }

  if (!hasSupabaseServerConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}
