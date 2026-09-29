"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";

export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useProgressStore.persist.rehydrate();
  }, []);

  return null;
}
