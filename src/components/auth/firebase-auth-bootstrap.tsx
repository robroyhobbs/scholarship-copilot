"use client";

import { useEffect } from "react";
import { ensureFirebaseClientSession } from "@/lib/firebase/client-auth";

export function FirebaseAuthBootstrap() {
  useEffect(() => {
    void ensureFirebaseClientSession().catch(() => null);
  }, []);

  return null;
}
