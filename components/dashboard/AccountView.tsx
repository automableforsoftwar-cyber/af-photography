"use client";

import { motion } from "framer-motion";
import { getModuleById, modules } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";

const ease = [0.22, 1, 0.36, 1] as const;

export function AccountView() {
  const email = useAuthStore((s) => s.email);
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const active = activeCourseId ? getModuleById(activeCourseId) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
      >
        <p className="text-sm font-medium text-yellow-400">حسابك</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          {email || "عضو AF P"}
        </h2>
        <div className="my-4 border-b border-white/10" />
        <p className="text-slate-300 leading-relaxed">
          حسابك مستقل عن الكورسات. افتح أي كورس بكود اشتراك خاص بيه — وتقدر تجمع
          أكتر من مسار على نفس الحساب.
        </p>

        {unlockedCourseIds.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-slate-500">كورساتك المفتوحة</p>
            <ul className="space-y-2">
              {unlockedCourseIds.map((id) => {
                const course = modules.find((m) => m.id === id) ?? getModuleById(id);
                const selected = id === activeCourseId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveCourseId(id)}
                      className={`w-full rounded-xl border px-4 py-3 text-start transition-colors ${
                        selected
                          ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                          : "border-white/10 bg-black/30 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      <span className="block font-medium">{course.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {course.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {active ? (
          <>
            <p className="mt-8 text-sm font-medium text-yellow-400">
              الكورس الحالي
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">
              {active.title}
            </h3>
            <div className="my-4 border-b border-white/10" />
            <p className="text-slate-300 leading-relaxed">{active.description}</p>
          </>
        ) : null}
      </motion.div>

      <div className="mx-auto mb-10 w-full max-w-2xl">
        <RedeemCodePanel />
      </div>
    </div>
  );
}
