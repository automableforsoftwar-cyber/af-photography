"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { getModuleById, modules } from "@/lib/content";
import { redeemCourseCode } from "@/lib/enroll";
import { useAuthStore } from "@/lib/auth-store";

const ease = [0.22, 1, 0.36, 1] as const;

type RedeemCodePanelProps = {
  onUnlocked?: (courseId: string) => void;
  compact?: boolean;
};

export function RedeemCodePanel({
  onUnlocked,
  compact = false,
}: RedeemCodePanelProps) {
  const addUnlockedCourse = useAuthStore((s) => s.addUnlockedCourse);
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await redeemCourseCode(code);
    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    // Strict mapping: unlock ONLY result.courseId (from access_codes.target_course)
    addUnlockedCourse(result.courseId);
    const course = getModuleById(result.courseId);
    setSuccess(`تم فتح «${course.title}» فقط — باقي الكورسات لسه مقفولة.`);
    setCode("");
    setLoading(false);
    onUnlocked?.(result.courseId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg ${
        compact ? "p-5" : "p-8"
      }`}
    >
      <p className="text-sm font-medium text-yellow-400">Course VIP Code</p>
      <h3
        className={`mt-2 font-display font-bold text-white ${
          compact ? "text-xl" : "text-2xl sm:text-3xl"
        }`}
      >
        Enter Course VIP Code
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        كل كود مربوط بكورس واحد (`target_course`). التفعيل بيفتح الكورس ده بس على
        حسابك — وتقدر تضيف كورسات تانية بكودات منفصلة لاحقاً.
      </p>

      {unlockedCourseIds.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {unlockedCourseIds.map((id) => {
            const course = modules.find((m) => m.id === id);
            return (
              <li
                key={id}
                className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-400"
              >
                {course?.title ?? id}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          لسه مفيش كورسات مفتوحة على الحساب.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
          placeholder="AFP-XXXX-XXXX"
          aria-label="Enter Course VIP Code"
          dir="ltr"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/40 disabled:opacity-50"
        />
        <PremiumButton type="submit" disabled={loading || !code.trim()}>
          {loading ? "جاري…" : "تفعيل"}
        </PremiumButton>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-yellow-400">{success}</p>
      ) : null}
    </motion.div>
  );
}
