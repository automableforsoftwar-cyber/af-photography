"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import {
  LearningHub,
  type DashboardPanel,
} from "@/components/dashboard/LearningHub";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { useAuthStore } from "@/lib/auth-store";
import { getModuleById } from "@/lib/content";

const ALL_PANELS: DashboardPanel[] = [
  "learn",
  "community",
  "inbox",
  "challenges",
  "gallery",
  "resources",
  "account",
];

const pillActions: { id: DashboardPanel; label: string }[] = [
  { id: "learn", label: "التعلم" },
  { id: "community", label: "المجتمع" },
  { id: "inbox", label: "الرسايل" },
  { id: "challenges", label: "المسابقات" },
  { id: "gallery", label: "المعرض" },
  { id: "resources", label: "الملحقات" },
  { id: "account", label: "حسابك" },
];

function isPanel(value: string | null): value is DashboardPanel {
  return Boolean(value && ALL_PANELS.includes(value as DashboardPanel));
}

export function CourseDashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const hasCourse = useAuthStore((s) => s.hasCourse);

  const locked = unlockedCourseIds.length === 0;
  const paramCourse = searchParams.get("course");
  const panelParam = searchParams.get("panel");

  const preferred =
    paramCourse && hasCourse(paramCourse)
      ? paramCourse
      : activeCourseId && hasCourse(activeCourseId)
        ? activeCourseId
        : (unlockedCourseIds[0] ?? null);

  useEffect(() => {
    if (preferred && preferred !== activeCourseId) {
      setActiveCourseId(preferred);
    }
  }, [preferred, activeCourseId, setActiveCourseId]);

  const course = preferred ? getModuleById(preferred) : null;
  const hasActiveCourse = Boolean(preferred && course);

  const [panel, setPanel] = useState<DashboardPanel>(() => {
    if (isPanel(panelParam)) return panelParam;
    return "learn";
  });

  useEffect(() => {
    if (locked) return;
    if (isPanel(panelParam) && panelParam !== panel) {
      setPanel(panelParam);
    }
  }, [locked, panel, panelParam]);

  const onSelectPanel = (id: DashboardPanel) => {
    if (locked) return;
    setPanel(id);
    const next = new URLSearchParams(searchParams.toString());
    next.set("panel", id);
    router.replace(`/course-dashboard?${next.toString()}`);
  };

  if (locked) {
    return (
      <AuthGate>
        <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505]">
          <div className="fixed inset-x-0 top-4 z-50 flex justify-end px-4 sm:px-8">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <AuthButton appearance="plain" />
            </div>
          </div>
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
            <RedeemCodePanel
              onUnlocked={(courseId) => {
                setActiveCourseId(courseId);
                router.replace(
                  `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
                );
              }}
            />
          </main>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] lg:h-svh lg:overflow-hidden">
        <nav
          aria-label="إجراءات اللوحة"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-x-5 sm:px-6 sm:py-3">
            {pillActions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPanel(item.id)}
                className={`text-sm font-medium transition-colors ${
                  panel === item.id
                    ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
            <AuthButton appearance="plain" />
          </div>
        </nav>

        <div className="flex min-h-0 flex-1 flex-col pt-20">
          <LearningHub
            course={course}
            hasActiveCourse={hasActiveCourse}
            panel={panel}
            onBackToLearn={() => onSelectPanel("learn")}
            onCourseUnlocked={(courseId) => {
              setActiveCourseId(courseId);
            }}
          />
        </div>
      </div>
    </AuthGate>
  );
}
