"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { site } from "@/lib/content";
import { signInWithEmail, signUpWithEmail } from "@/lib/enroll";
import { useAuthStore } from "@/lib/auth-store";
import { getPostAuthPath } from "@/lib/routing";
import { supabase } from "@/lib/supabase";

const ease = [0.22, 1, 0.36, 1] as const;

type AuthTab = "signup" | "login";

type EnrollmentModalProps = {
  open: boolean;
  onClose: () => void;
  /** Return `true` to stay on the current page (skip post-auth dashboard redirect). */
  onSuccess?: () => boolean | void;
  /** Optional context line under the title */
  contextLabel?: string | null;
};

export function EnrollmentModal({
  open,
  onClose,
  onSuccess,
  contextLabel,
}: EnrollmentModalProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [tab, setTab] = useState<AuthTab>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, loading]);

  useEffect(() => {
    if (!open) {
      setTab("signup");
      setFullName("");
      setEmail("");
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const canSubmit = Boolean(
    email.trim() &&
      password.length >= 6 &&
      (tab === "login" || fullName.trim()),
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    const result =
      tab === "signup"
        ? await signUpWithEmail({ email, password, fullName })
        : await signInWithEmail({ email, password });

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    login({
      userId: result.userId,
      email: result.email,
      fullName: result.fullName,
    });
    const { data: sessionData } = await supabase.auth.getSession();
    await useAuthStore.getState().hydrateFromSession(sessionData.session);
    await useAuthStore.getState().refreshProfileFlags();
    await useAuthStore.getState().refreshCourses();
    const destination = getPostAuthPath();
    setLoading(false);
    onClose();
    const stay = onSuccess?.() === true;
    if (!stay && destination && destination !== "/") {
      router.replace(destination);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <button
            type="button"
            aria-label="قفل النافذة"
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={loading ? undefined : onClose}
            disabled={loading}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative my-auto w-full max-w-md max-h-[min(100svh,100dvh)] overflow-y-auto rounded-3xl border border-white/10 bg-[#0c0c0c]/95 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.4, ease }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent"
              aria-hidden="true"
            />

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute end-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-sm text-slate-200 transition-colors hover:border-yellow-400/50 hover:text-yellow-400 disabled:opacity-40"
              aria-label="قفل"
            >
              ✕
            </button>

            <div className="relative p-6 sm:p-8">
              <p className="text-xs font-medium tracking-wide text-yellow-400/90">
                {site.name}
              </p>
              <h2
                id={titleId}
                className="mt-2 font-display text-2xl font-bold text-white"
              >
                أهلاً بيك في الكوميونيتي
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {contextLabel ??
                  "اعمل حساب بإيميلك — فتح الكورسات بيحصل بعدين بكود الاشتراك من لوحة التعلم."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/40 p-1">
                <TabButton
                  active={tab === "signup"}
                  disabled={loading}
                  onClick={() => {
                    setTab("signup");
                    setError(null);
                  }}
                >
                  إنشاء حساب
                </TabButton>
                <TabButton
                  active={tab === "login"}
                  disabled={loading}
                  onClick={() => {
                    setTab("login");
                    setError(null);
                  }}
                >
                  تسجيل دخول
                </TabButton>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {tab === "signup" ? (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">
                      الاسم بالكامل
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError(null);
                      }}
                      required
                      disabled={loading}
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-yellow-400/50 disabled:opacity-50"
                      placeholder="مثال: أحمد خالد"
                    />
                  </label>
                ) : null}

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    الإيميل
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    required
                    disabled={loading}
                    autoComplete="email"
                    dir="ltr"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-yellow-400/50 disabled:opacity-50"
                    placeholder="name@email.com"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    كلمة المرور
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete={
                      tab === "signup" ? "new-password" : "current-password"
                    }
                    dir="ltr"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-yellow-400/50 disabled:opacity-50"
                    placeholder="٦ حروف على الأقل"
                  />
                </label>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm leading-relaxed text-red-300"
                  >
                    {error}
                  </p>
                ) : null}

                <PremiumButton
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="mt-2 w-full"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-4 animate-spin rounded-full border-2 border-[#050505]/30 border-t-[#050505]"
                        aria-hidden="true"
                      />
                      جاري التحقق…
                    </span>
                  ) : tab === "signup" ? (
                    "إنشاء حساب"
                  ) : (
                    "تسجيل دخول"
                  )}
                </PremiumButton>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        active
          ? "bg-yellow-400 text-[#050505]"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
