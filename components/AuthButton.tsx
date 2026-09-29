"use client";

import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuthStore } from "@/lib/auth-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function AuthButton({
  appearance = "button",
}: {
  appearance?: "button" | "plain";
}) {
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const email = useAuthStore((state) => state.email);
  const logout = useAuthStore((state) => state.logout);
  const signedIn = hydrated && isLoggedIn;

  const onLogout = () => {
    void logout();
  };

  if (appearance === "plain") {
    if (!signedIn) return null;
    return (
      <button
        type="button"
        onClick={onLogout}
        title="خروج"
        aria-label="خروج من الحساب"
        className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-200"
      >
        خروج
      </button>
    );
  }

  if (signedIn) {
    return (
      <PremiumButton
        variant="glass"
        size="sm"
        onClick={onLogout}
        title="اخرج"
        aria-label="داخل. اضغط عشان تخرج"
        className="gap-2 normal-case tracking-normal"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-yellow-400/50 bg-black/40 text-[0.6rem] font-medium text-yellow-400">
          أف
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline" dir="ltr">
          {email || "حسابك"}
        </span>
      </PremiumButton>
    );
  }

  return null;
}
