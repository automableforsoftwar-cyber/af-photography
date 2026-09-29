"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { CourseModule } from "@/lib/content";
import { site } from "@/lib/content";
import { enrollWithAccessCode } from "@/lib/enroll";
import { useAuthStore } from "@/lib/auth-store";

const ease = [0.22, 1, 0.36, 1] as const;

type EnrollmentModalProps = {
  course: CourseModule | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function EnrollmentModal({
  course,
  onClose,
  onSuccess,
}: EnrollmentModalProps) {
  const login = useAuthStore((s) => s.login);
  const [code, setCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = course !== null;

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
      setCode("");
      setMobile("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!course || !code.trim() || !mobile.trim() || loading) return;

    setLoading(true);
    setError(null);

    const result = await enrollWithAccessCode({
      code,
      phone: mobile,
    });

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    login({
      paymentCode: code,
      mobile,
      courseId: course.id,
    });
    setLoading(false);
    onClose();
    onSuccess?.();
  };

  return (
    <AnimatePresence>
      {open && course ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <button
            type="button"
            aria-label="قفل النافذة"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={loading ? undefined : onClose}
            disabled={loading}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
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
                هتفتح «{course.title}» بعد ما تدخل كود الاشتراك ورقم الموبايل.
                معاك {site.founder} ({site.founderEn}).
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    كود الاشتراك
                  </span>
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(null);
                    }}
                    required
                    disabled={loading}
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-yellow-400/50 disabled:opacity-50"
                    placeholder="اكتب كود الدفع"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    رقم الموبايل
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      setError(null);
                    }}
                    required
                    disabled={loading}
                    autoComplete="tel"
                    inputMode="tel"
                    dir="ltr"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-yellow-400/50 disabled:opacity-50"
                    placeholder="01xxxxxxxxx"
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
                  disabled={loading || !code.trim() || !mobile.trim()}
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
                  ) : (
                    "دخول"
                  )}
                </PremiumButton>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
