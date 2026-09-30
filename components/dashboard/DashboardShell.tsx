"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import { AccountView } from "@/components/dashboard/AccountView";
import { CommunityView } from "@/components/community/CommunityView";
import { CompetitionPhotoVoting } from "@/components/community/CompetitionPhotoVoting";
import { CoursesHub } from "@/components/dashboard/CoursesHub";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";
import { HubResources } from "@/components/dashboard/HubResources";
import { InboxView } from "@/components/dashboard/InboxView";
import { useAuthStore } from "@/lib/auth-store";
import { getModuleById, site } from "@/lib/content";

const NAV: { href: string; label: string }[] = [
  { href: "/dashboard", label: "الرئيسية" },
  { href: "/dashboard/courses", label: "الكورسات" },
  { href: "/dashboard/community", label: "المجتمع" },
  { href: "/dashboard/inbox", label: "الرسايل" },
  { href: "/dashboard/challenges", label: "المسابقات" },
  { href: "/dashboard/gallery", label: "المعرض" },
  { href: "/dashboard/resources", label: "الملحقات" },
  { href: "/dashboard/account", label: "حسابك" },
];

type DashboardShellProps = {
  section:
    | "home"
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
  const email = useAuthStore((s) => s.email);

  const paramCourse = searchParams.get("course");
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

  const selectCourse = (courseId: string) => {
    if (!courseId) {
      setActiveCourseId(null);
      router.replace("/dashboard/courses");
      return;
    }
    if (!hasCourse(courseId)) return;
    setActiveCourseId(courseId);
    router.replace(
      `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
    );
  };

  const onUnlocked = (courseId: string) => {
    setActiveCourseId(courseId);
    router.replace(
      `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
    );
  };

  return (
    <AuthGate>
      <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] lg:h-svh lg:overflow-hidden">
        <nav
          aria-label="إجراءات اللوحة"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-x-5 sm:px-6 sm:py-3">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
          {section === "home" ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10 text-center">
              <p className="text-sm font-medium text-yellow-400">{site.name}</p>
              <h1 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                أهلاً{email ? `، ${email.split("@")[0]}` : ""}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                لوحة التحكم مفتوحة بالكامل. فعّل كورساتك من صفحة «الكورسات» بكود
                الـ VIP — كل كود بيفتح كورس واحد بس.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/courses"
                  className="rounded-full border border-yellow-400/50 bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
                >
                  الكورسات وتفعيل الكود
                </Link>
                <Link
                  href="/dashboard/community"
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-yellow-400/40 hover:text-yellow-400"
                >
                  المجتمع
                </Link>
              </div>
              {unlockedCourseIds.length > 0 ? (
                <p className="mt-6 text-xs text-slate-500">
                  كورسات مفتوحة: {unlockedCourseIds.length}
                </p>
              ) : (
                <p className="mt-6 text-xs text-slate-500">
                  لسه مفيش كورس مفتوح — روح للكورسات وحط الكود.
                </p>
              )}
            </div>
          ) : section === "courses" ? (
            <CoursesHub
              activeCourse={course}
              onSelectCourse={selectCourse}
              onUnlocked={onUnlocked}
            />
          ) : section === "community" ? (
            <CommunityView />
          ) : section === "inbox" ? (
            <InboxView />
          ) : section === "challenges" ? (
            <CompetitionPhotoVoting />
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
