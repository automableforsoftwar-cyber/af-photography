"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { CourseModule } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

type AuthModalProps = {
  module: CourseModule | null;
  onClose: () => void;
};

type AuthMode = "register" | "login";

export function AuthModal({ module, onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("register");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = module !== null;

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && module ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button
            type="button"
            aria-label="قفل النافذة"
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md overflow-hidden border border-white/15 bg-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-background/40" />

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center border border-white/15 bg-background/30 text-sm font-medium text-slate-200 transition-colors hover:border-gold hover:text-gold"
              aria-label="قفل"
            >
              ×
            </button>

            <div className="relative px-6 pb-8 pt-10 sm:px-8">
              <p className="kicker">لازم تدخل الأول</p>
              <h2
                id={titleId}
                className="font-display text-blend mt-3 text-balance text-3xl font-bold leading-snug sm:text-4xl"
              >
                ادخل أو اعمل حساب عشان تكمّل
              </h2>
              <p className="mt-3 text-sm font-normal leading-loose text-slate-400">
                سجّل عشان تلحق{" "}
                <span className="text-gold-soft">{module.title}</span>. بعد الخطوة
                دي هتروح على الدفع.
              </p>

              <div className="mt-7 grid grid-cols-2 border border-white/10 bg-background/25 p-1">
                <ModeTab
                  active={mode === "register"}
                  onClick={() => setMode("register")}
                >
                  حساب جديد
                </ModeTab>
                <ModeTab
                  active={mode === "login"}
                  onClick={() => setMode("login")}
                >
                  دخول
                </ModeTab>
              </div>

              <form
                className="mt-7 flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  // Legacy modal — prefer EnrollmentModal (VIP + session auth).
                  onClose();
                  router.push(`/payment?course=${module.id}`);
                }}
              >
                {mode === "register" ? (
                  <Field
                    id="auth-name"
                    label="الاسم بالكامل"
                    type="text"
                    autoComplete="name"
                    placeholder="مثال: أحمد خالد"
                  />
                ) : null}
                <Field
                  id="auth-email"
                  label="البريد"
                  type="email"
                  autoComplete="email"
                  placeholder="ahmad@studio.com"
                />
                <Field
                  id="auth-password"
                  label="كلمة المرور"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  placeholder="٨ حروف على الأقل"
                />
                <PremiumButton type="submit" className="mt-2 w-full">
                  {mode === "register"
                    ? "اعمل حساب وكمل"
                    : "ادخل وكمل"}
                </PremiumButton>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 text-sm font-medium tracking-normal transition-colors ${
        active
          ? "bg-gold text-background"
          : "text-slate-400 hover:text-slate-200"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-slate-400">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="border border-white/15 bg-background/40 px-3 py-2.5 text-start text-sm font-normal leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-400 focus:border-gold"
      />
    </label>
  );
}
