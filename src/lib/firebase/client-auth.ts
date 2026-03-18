"use client";

import { signInAnonymously } from "firebase/auth";
import { getFirebaseClientAuth, hasFirebaseClientConfig } from "@/lib/firebase/client";

let authSessionPromise: Promise<string | null> | null = null;

export async function ensureFirebaseClientSession() {
  if (typeof window === "undefined" || !hasFirebaseClientConfig()) {
    return null;
  }

  const auth = getFirebaseClientAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authSessionPromise) {
    authSessionPromise = signInAnonymously(auth)
      .then(({ user }) => user.getIdToken())
      .catch((error) => {
        authSessionPromise = null;
        throw error;
      });
  }

  await authSessionPromise;
  return auth.currentUser;
}

export async function getFirebaseIdToken() {
  const user = await ensureFirebaseClientSession().catch(() => null);
  return user ? user.getIdToken() : null;
}
