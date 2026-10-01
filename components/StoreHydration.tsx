"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";
import { supabase } from "@/lib/supabase";

/**
 * Rehydrates Zustand FIRST, then syncs role/title from Supabase session.
 * Order matters: if session sync runs before persist.rehydrate finishes,
 * stale localStorage (role=student) overwrites the live DB role.
 */
export function StoreHydration() {
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      await Promise.all([
        useAuthStore.persist.rehydrate(),
        useProgressStore.persist.rehydrate(),
      ]);
      if (cancelled) return;

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      await useAuthStore.getState().hydrateFromSession(data.session);
      // Force a second profile read so RBAC always wins over stale persist
      if (data.session?.user) {
        await useAuthStore.getState().refreshProfileFlags();
      }
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        await useAuthStore.getState().hydrateFromSession(session);
        if (session?.user) {
          await useAuthStore.getState().refreshProfileFlags();
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
