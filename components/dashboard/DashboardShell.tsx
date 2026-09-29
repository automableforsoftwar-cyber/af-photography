"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { AccountView } from "@/components/dashboard/AccountView";
import { CommunityView } from "@/components/community/CommunityView";
import { PublicPhotoVoting } from "@/components/community/PublicPhotoVoting";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";
import { HubResources } from "@/components/dashboard/HubResources";
import { InboxView } from "@/components/dashboard/InboxView";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { useAuthStore } from "@/lib/auth-store";
import { getModuleById } from "@/lib/content";

const NAV: { href: string; label: string }[] = [
  { href: "/dashboard/courses", label: "التعلم" },
  { href: "/dashboard/community", label: "المجتمع" },
  { href: "/dashboard/inbox", label: "الرسايل" },
  { href: "/dashboard/challenges", label: "المسابقات" },
  { href: "/dashboard/gallery", label: "المعرض" },
  { href: "/dashboard/resources", label: "الملحقات" },
  { href: "/dashboard/account", label: "حسابك" },
];

type DashboardShellProps = {
  section:
    | "activate"
    | "courses"
    | "community"
    | "inbox"
    | "challenges"
    | "gallery"
    | "resources"
    | "account";
};

export function DashboardShell({ section }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const locked = unlockedCourseIds.length === 0;

  const paramCourse = searchParams.get("course");
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

  // ABSOLUTE LOCK — no escape via URL
  useEffect(() => {
    if (locked && section !== "activate") {
      router.replace("/dashboard/activate");
    }
  }, [locked, section, router]);

  const course = preferred ? getModuleById(preferred) : null;

  // ——— Locked: only activation + logout. No sidebar / no nav pills. ———
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
            <p className="mb-6 text-center text-sm text-slate-400">
              لازم تفعّل كود كورس عشان تفتح اللوحة. مفيش أي صفحة تانية متاحة دلوقتي.
            </p>
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

  // ——— Unlocked: full dashboard ———
  return (
    <AuthGate>
      <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] lg:h-svh lg:overflow-hidden">
        <nav
          aria-label="إجراءات اللوحة"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-x-5 sm:px-6 sm:py-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={
                    item.href === "/dashboard/courses" && preferred
                      ? `${item.href}?course=${encodeURIComponent(preferred)}`
                      : item.href
                  }
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <AuthButton appearance="plain" />
          </div>
        </nav>

        <main
          id="main"
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-20 sm:px-6 lg:px-8"
        >
          {section === "activate" ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8">
              <RedeemCodePanel
                onUnlocked={(courseId) => {
                  setActiveCourseId(courseId);
                  router.replace(
                    `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
                  );
                }}
              />
            </div>
          ) : section === "courses" && course ? (
            <AiLearningChat course={course} />
          ) : section === "courses" ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
              <RedeemCodePanel />
            </div>
          ) : section === "community" ? (
            <CommunityView />
          ) : section === "inbox" ? (
            <InboxView />
          ) : section === "challenges" ? (
            <PublicPhotoVoting variant="competition" />
          ) : section === "gallery" ? (
            <DashboardGallery />
          ) : section === "resources" ? (
            <div className="overflow-y-auto">
              <HubResources />
            </div>
          ) : section === "account" ? (
            <AccountView />
          ) : null}
        </main>
      </div>
    </AuthGate>
  );
}
