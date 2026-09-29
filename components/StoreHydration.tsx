"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";
import { supabase } from "@/lib/supabase";

/**
 * Rehydrates Zustand + keeps it in sync with the Supabase auth session.
 */
export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useProgressStore.persist.rehydrate();

    let cancelled = false;

    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      await useAuthStore.getState().hydrateFromSession(data.session);
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void useAuthStore.getState().hydrateFromSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
