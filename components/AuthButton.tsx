"use client";

import { useRouter } from "next/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuthStore } from "@/lib/auth-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

type AuthButtonProps = {
  appearance?: "button" | "plain";
  /**
   * exit-home — leave dashboard/course to public homepage (stay logged in).
   * logout — fully sign out of Supabase.
   */
  intent?: "exit-home" | "logout";
};

export function AuthButton({
  appearance = "button",
  intent = "logout",
}: AuthButtonProps) {
  const router = useRouter();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const email = useAuthStore((state) => state.email);
  const logout = useAuthStore((state) => state.logout);
  const signedIn = hydrated && isLoggedIn;

  const onClick = () => {
    if (intent === "exit-home") {
      router.push("/");
      return;
    }
    void logout();
  };

  if (appearance === "plain") {
    if (!signedIn) return null;
    const isExit = intent === "exit-home";
    return (
      <button
        type="button"
        onClick={onClick}
        title={isExit ? "خروج للكورس — الرجوع للرئيسية" : "تسجيل الخروج"}
        aria-label={isExit ? "خروج للكورس بدون تسجيل خروج" : "خروج من الحساب"}
        className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-200"
      >
        {isExit ? "خروج" : "تسجيل الخروج"}
      </button>
    );
  }

  if (signedIn) {
    return (
      <PremiumButton
        variant="glass"
        size="sm"
        onClick={onClick}
        title={intent === "exit-home" ? "رجوع للرئيسية" : "اخرج"}
        aria-label={
          intent === "exit-home"
            ? "رجوع للرئيسية مع البقاء مسجّل"
            : "داخل. اضغط عشان تخرج من الحساب"
        }
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
