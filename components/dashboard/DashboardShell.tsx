"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthButton } from "@/components/AuthButton";
import { AuthGate } from "@/components/AuthGate";
import { AccountView } from "@/components/dashboard/AccountView";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { CommunityView } from "@/components/community/CommunityView";
import { CompetitionPhotoVoting } from "@/components/community/CompetitionPhotoVoting";
import { CourseRoom } from "@/components/dashboard/CourseRoom";
import { CoursesHub } from "@/components/dashboard/CoursesHub";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";
import { useAuthStore } from "@/lib/auth-store";
import { modules, site } from "@/lib/content";
import { pickDisplayName } from "@/lib/display-name";
import { useLiveStaffRole } from "@/lib/use-live-staff";

const NAV: {
  href: string;
  label: string;
  staffOnly?: boolean;
  /** Hide from instructor/organizer — they use Admin Command Center instead. */
  studentsOnly?: boolean;
}[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/dashboard/courses", label: "الكورسات", studentsOnly: true },
  { href: "/dashboard/community", label: "المجتمع", studentsOnly: true },
  { href: "/dashboard/challenges", label: "المسابقات", studentsOnly: true },
  {
    href: "/dashboard/gallery",
    label: "معرض الفائزين",
    studentsOnly: true,
  },
  { href: "/dashboard/admin", label: "الإدارة", staffOnly: true },
  { href: "/dashboard/account", label: "حسابك" },
];

type DashboardShellProps = {
  section:
    | "home"
    | "courses"
    | "course"
    | "community"
    | "challenges"
    | "gallery"
    | "account"
    | "admin";
  courseId?: string;
};

export function DashboardShell({ section, courseId }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const welcomeName = pickDisplayName(fullName, email);
  const { isStaff, title: staffTitle } = useLiveStaffRole();
  const showAdmin = isStaff;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isCommunity = section === "community";
  const navItems = NAV.filter((item) => {
    if (item.staffOnly && !showAdmin) return false;
    if (item.studentsOnly && showAdmin) return false;
    return true;
  });

  // Staff opening Community/Gallery routes → Admin Command Center
  useEffect(() => {
    if (!isStaff) return;
    if (section === "community" || section === "gallery") {
      router.replace("/dashboard/admin");
    }
  }, [isStaff, section, router]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onUnlocked = (id: string) => {
    setActiveCourseId(id);
    router.replace(`/dashboard/courses/${encodeURIComponent(id)}`);
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const mobileMenu =
    mounted && mobileNavOpen
      ? createPortal(
          <div className="fixed inset-0 z-[10050] lg:hidden">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="absolute inset-0 bg-black/80"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              id="dashboard-mobile-menu"
              className="fixed inset-y-0 left-0 z-[10051] flex h-[100dvh] w-[min(18rem,85vw)] flex-col bg-[#0a0a0a] shadow-2xl"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <div
                className="border-b border-white/10 px-5 py-5"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <p className="font-display text-lg font-bold text-yellow-400">
                  القائمة
                </p>
                <p className="mt-1 text-xs text-slate-500">تنقّل اللوحة</p>
              </div>
              <ul
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                        className={`block rounded-xl px-3 py-3 text-sm font-medium ${
                          active
                            ? "bg-yellow-400/15 text-yellow-400"
                            : "text-white hover:bg-white/5 hover:text-yellow-400"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div
                className="border-t border-white/10 p-4"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <AuthButton appearance="plain" intent="exit-home" />
                {/* Logout is LAST item in the mobile drawer only */}
                <div className="mt-2">
                  <AuthButton appearance="plain" intent="logout" />
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <AuthGate>
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#050505]">
        {/* Desktop top nav — logo + links only (no logout in header) */}
        <nav
          aria-label="إجراءات اللوحة"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 hidden justify-center px-3 lg:flex"
        >
          <div
            dir="rtl"
            className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-white/10 bg-[#0a0a0a] px-4 py-2.5 sm:gap-x-5 sm:px-6 sm:py-3"
          >
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 border-e border-white/10 pe-4"
            >
              <Image
                src="/images/af-mark.svg"
                alt={site.name}
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="font-display text-sm font-bold text-yellow-400">
                {site.name}
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`text-sm font-medium ${
                      active
                        ? "text-yellow-400"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Mobile top bar — ONLY hamburger (left) + logo (right) */}
        <div
          dir="ltr"
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <button
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="dashboard-mobile-menu"
            aria-label={mobileNavOpen ? "اقفل القائمة" : "افتح القائمة"}
            className="relative z-[61] flex h-10 w-10 shrink-0 items-center justify-center"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span
              className={`absolute h-px w-5 bg-white ${
                mobileNavOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-px w-5 bg-white ${
                mobileNavOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <p className="font-display truncate text-sm font-bold text-yellow-400">
              {site.name}
            </p>
            <Image
              src="/images/af-mark.svg"
              alt={site.name}
              width={28}
              height={28}
              className="shrink-0 rounded-md"
            />
          </Link>
        </div>

        {mobileMenu}

        <main
          id="main"
          className={
            isCommunity
              ? "flex min-h-0 flex-1 flex-col overflow-hidden pt-14 lg:pt-20"
              : "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-14 sm:px-6 lg:px-8 lg:pt-20"
          }
        >
          {section === "home" ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10 text-center">
              <p className="text-sm font-medium text-yellow-400">{site.name}</p>
              <h1 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                أهلاً{welcomeName ? `، ${welcomeName}` : ""}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                لوحة التحكم مفتوحة. ادخل كورس من «الكورسات» — لو مش مفعّل هتظهر
                شاشة كود الـ VIP جوه صفحة الكورس.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {showAdmin ? (
                  <Link
                    href="/dashboard/admin"
                    className="rounded-full border border-yellow-400/50 bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
                  >
                    لوحة الإدارة{staffTitle ? ` · ${staffTitle}` : ""}
                  </Link>
                ) : (
                  <>
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
                    <Link
                      href="/dashboard/challenges"
                      className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-yellow-400/40 hover:text-yellow-400"
                    >
                      المسابقات
                    </Link>
                    <Link
                      href="/dashboard/gallery"
                      className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-yellow-400/40 hover:text-yellow-400"
                    >
                      معرض الفائزين
                    </Link>
                  </>
                )}
              </div>
              {unlockedCourseIds.length > 0 || isStaff ? (
                <p className="mt-6 text-xs text-slate-500">
                  {isStaff
                    ? "مفتاح الإدارة نشط — كل الكورسات مفتوحة."
                    : `كورسات مفتوحة: ${unlockedCourseIds.length}`}
                </p>
              ) : (
                <p className="mt-6 text-xs text-slate-500">
                  لسه مفيش كورس مفتوح — روح للكورسات وادخل كورس عشان تفعّل.
                </p>
              )}
            </div>
          ) : section === "courses" ? (
            <CoursesHub onUnlocked={onUnlocked} />
          ) : section === "course" && courseId ? (
            <CourseRoom courseId={courseId} />
          ) : section === "community" ? (
            activeCourseId || isStaff ? (
              <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
                <CommunityView
                  key={
                    activeCourseId ?? modules[0]?.id ?? "photographer-eye"
                  }
                  courseId={
                    activeCourseId ?? modules[0]?.id ?? "photographer-eye"
                  }
                  initialTab="general"
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                افتح كورس مفعّل أولاً عشان تدخل مجتمع المسار المعزول.
              </div>
            )
          ) : section === "challenges" ? (
            <CompetitionPhotoVoting />
          ) : section === "gallery" ? (
            <DashboardGallery />
          ) : section === "account" ? (
            <AccountView />
          ) : section === "admin" ? (
            <AdminDashboard embedded />
          ) : null}
        </main>
      </div>
    </AuthGate>
  );
}
