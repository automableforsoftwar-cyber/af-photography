"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { isStaffRole, normalizeRole, titleForRole, type UserRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

export type LiveStaffState = {
  ready: boolean;
  role: UserRole;
  title: string | null;
  isBlocked: boolean;
  isChatBlocked: boolean;
  isStaff: boolean;
};

/**
 * Failsafe: always re-read role/title/blocks from profiles (ignores stale Zustand).
 */
export function useLiveStaffRole(): LiveStaffState {
  const userId = useAuthStore((s) => s.userId);
  const storeRole = useAuthStore((s) => s.role);
  const storeTitle = useAuthStore((s) => s.title);
  const storeBlocked = useAuthStore((s) => s.isBlocked);
  const storeChatBlocked = useAuthStore((s) => s.isChatBlocked);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<UserRole>(storeRole);
  const [title, setTitle] = useState<string | null>(storeTitle);
  const [isBlocked, setIsBlocked] = useState(storeBlocked);
  const [isChatBlocked, setIsChatBlocked] = useState(storeChatBlocked);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        if (!cancelled) {
          setRole("student");
          setTitle(null);
          setIsBlocked(false);
          setIsChatBlocked(false);
          setReady(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, title, is_blocked, is_chat_blocked")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("useLiveStaffRole:", error);
        setReady(true);
        return;
      }

      const nextRole = normalizeRole(data?.role);
      const nextTitle =
        (data?.title as string | null)?.trim() || titleForRole(nextRole);
      const nextBlocked = Boolean(data?.is_blocked);
      const nextChatBlocked = Boolean(data?.is_chat_blocked);

      setRole(nextRole);
      setTitle(nextTitle);
      setIsBlocked(nextBlocked);
      setIsChatBlocked(nextChatBlocked);
      setReady(true);

      useAuthStore.setState({
        role: nextRole,
        title: nextTitle,
        isBlocked: nextBlocked,
        isChatBlocked: nextChatBlocked,
      });
    };

    void load();

    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId]);

  const isStaff = isStaffRole(role) && !isBlocked;

  return { ready, role, title, isBlocked, isChatBlocked, isStaff };
}
