"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import {
  LearningHub,
  type DashboardPanel,
} from "@/components/dashboard/LearningHub";
import { useAuthStore } from "@/lib/auth-store";
import { getModuleById } from "@/lib/content";

const pillActions: { id: DashboardPanel; label: string }[] = [
  { id: "learn", label: "التعلم" },
  { id: "community", label: "المجتمع" },
  { id: "inbox", label: "الرسايل" },
  { id: "challenges", label: "المسابقات" },
  { id: "gallery", label: "المعرض" },
  { id: "resources", label: "الملحقات" },
  { id: "account", label: "حسابك" },
];

export function CourseDashboardView() {
  const searchParams = useSearchParams();
  const enrolledCourseId = useAuthStore((s) => s.enrolledCourseId);
  const course = getModuleById(
    searchParams.get("course") ?? enrolledCourseId,
  );
  const [panel, setPanel] = useState<DashboardPanel>("learn");

  return (
    <AuthGate>
      <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] lg:h-svh lg:overflow-hidden">
        <nav
          aria-label="إجراءات اللوحة"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-x-5 sm:px-6 sm:py-3">
            {pillActions.map((item) => {
              const active = panel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPanel(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <AuthButton appearance="plain" />
          </div>
        </nav>

        <main id="main" className="flex min-h-0 flex-1 flex-col pt-20">
          <LearningHub
            course={course}
            panel={panel}
            onBackToLearn={() => setPanel("learn")}
          />
        </main>
      </div>
    </AuthGate>
  );
}
