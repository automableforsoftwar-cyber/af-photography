"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import {
  LearningHub,
  type DashboardPanel,
} from "@/components/dashboard/LearningHub";
import { CoursesHub } from "@/components/dashboard/CoursesHub";
import { useAuthStore } from "@/lib/auth-store";
import { getModuleById } from "@/lib/content";

const ALL_PANELS: DashboardPanel[] = [
  "learn",
  "community",
  "inbox",
  "challenges",
  "gallery",
  "account",
];

const pillActions: { id: DashboardPanel; label: string }[] = [
  { id: "learn", label: "الكورسات" },
  { id: "community", label: "المجتمع" },
  { id: "inbox", label: "الرسايل" },
  { id: "challenges", label: "المسابقات" },
  { id: "gallery", label: "معرض الفائزين" },
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

  const paramCourse = searchParams.get("course");
  const panelParam = searchParams.get("panel");

  const preferred =
    paramCourse && hasCourse(paramCourse)
      ? paramCourse
      : activeCourseId && hasCourse(activeCourseId)
        ? activeCourseId
        : null;

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
    if (isPanel(panelParam) && panelParam !== panel) {
      setPanel(panelParam);
    }
  }, [panel, panelParam]);

  const onSelectPanel = (id: DashboardPanel) => {
    setPanel(id);
    const next = new URLSearchParams(searchParams.toString());
    next.set("panel", id);
    router.replace(`/course-dashboard?${next.toString()}`);
  };

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
            <AuthButton appearance="plain" intent="exit-home" />
          </div>
        </nav>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-20 sm:px-6 lg:px-8">
          {panel === "learn" ? (
            <CoursesHub
              onUnlocked={(courseId) => setActiveCourseId(courseId)}
            />
          ) : (
            <LearningHub
              course={course}
              hasActiveCourse={hasActiveCourse}
              panel={panel}
              onBackToLearn={() => onSelectPanel("learn")}
              onCourseUnlocked={(courseId) => {
                setActiveCourseId(courseId);
              }}
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
