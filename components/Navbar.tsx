"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthButton } from "@/components/AuthButton";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { SocialIconLinks } from "@/components/SocialIconLinks";
import { navLinks, site } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import { useLiveStaffRole } from "@/lib/use-live-staff";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { isStaff } = useLiveStaffRole();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const mobileMenu =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[10050] lg:hidden">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="absolute inset-0 bg-black/80"
              onClick={() => setOpen(false)}
            />
            <aside
              id="mobile-menu"
              className="fixed inset-y-0 left-0 z-[10051] flex h-[100dvh] w-[min(18rem,85vw)] flex-col shadow-2xl"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <div
                className="border-b border-white/10 px-5 py-5"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <p className="font-display text-lg font-bold text-yellow-400">
                  {site.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{site.project}</p>
              </div>
              <ul
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="block rounded-xl px-3 py-3 text-sm font-medium text-white hover:bg-white/5 hover:text-yellow-400"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {isLoggedIn ? (
                  <>
                    {isStaff ? (
                      <li>
                        <Link
                          href="/dashboard/admin"
                          className="block rounded-xl px-3 py-3 text-sm font-medium text-yellow-400 hover:bg-yellow-400/10"
                          onClick={() => setOpen(false)}
                        >
                          الإدارة
                        </Link>
                      </li>
                    ) : null}
                    <li>
                      <a
                        href="#curriculum"
                        className="block rounded-xl px-3 py-3 text-sm font-medium text-yellow-400 hover:bg-yellow-400/10"
                        onClick={() => setOpen(false)}
                      >
                        الكورسات
                      </a>
                    </li>
                  </>
                ) : (
                  <li>
                    <button
                      type="button"
                      className="block w-full rounded-xl px-3 py-3 text-right text-sm font-medium text-yellow-400 hover:bg-yellow-400/10"
                      onClick={() => {
                        setOpen(false);
                        setAuthOpen(true);
                      }}
                    >
                      تسجيل دخول / إنشاء حساب
                    </button>
                  </li>
                )}
              </ul>
              <div
                className="flex flex-col gap-3 border-t border-white/10 p-4"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <SocialIconLinks />
                {isLoggedIn ? (
                  <AuthButton appearance="plain" intent="logout" />
                ) : null}
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${
        scrolled || open
          ? "border-b border-white/10 bg-[#0a0a0a]"
          : "border-b border-transparent bg-transparent"
      }`}
      style={scrolled || open ? { backgroundColor: "#0a0a0a" } : undefined}
    >
      <nav
        dir="ltr"
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-10"
        aria-label="رئيسي"
      >
        {/* Mobile/Desktop: hamburger LEFT — logout is NEVER in the top header */}
        <button
          type="button"
          className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "اقفل القائمة" : "افتح القائمة"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "اقفل القائمة" : "افتح القائمة"}</span>
          <span
            className={`absolute h-px w-5 bg-white transition-transform duration-300 ${
              open ? "rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute h-px w-5 bg-white transition-transform duration-300 ${
              open ? "-rotate-45" : "translate-y-1.5"
            }`}
          />
        </button>

        <ul className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-200 transition-colors hover:text-yellow-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SocialIconLinks className="hidden sm:flex" />
          {hydrated && isLoggedIn ? (
            <>
              {isStaff ? (
                <Link
                  href="/dashboard/admin"
                  className="hidden rounded-full border border-yellow-400/50 bg-yellow-400/15 px-3.5 py-2 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-[#050505] sm:inline-flex sm:px-4 sm:text-sm"
                >
                  الإدارة
                </Link>
              ) : null}
              <a
                href="#curriculum"
                className="hidden rounded-full border border-yellow-400/50 bg-yellow-400 px-3.5 py-2 text-xs font-semibold text-[#050505] shadow-[0_0_28px_rgba(251,191,36,0.35)] transition hover:bg-yellow-300 sm:inline-flex sm:px-5 sm:text-sm"
              >
                الكورسات
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="hidden rounded-full border border-yellow-400/50 bg-yellow-400 px-3.5 py-2 text-xs font-semibold text-[#050505] shadow-[0_0_28px_rgba(251,191,36,0.35)] transition hover:bg-yellow-300 sm:inline-flex sm:px-5 sm:text-sm"
            >
              تسجيل دخول / إنشاء حساب
            </button>
          )}
          {/* Logo RIGHT */}
          <a href="#main" className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <span className="leading-tight text-end">
              <span className="block font-display text-base font-bold text-yellow-400 sm:text-lg">
                {site.name}
              </span>
              <span className="hidden text-[0.7rem] font-medium text-slate-400 sm:block">
                {site.fullName} · {site.project}
              </span>
            </span>
            <Image
              src="/images/af-mark.svg"
              alt={site.name}
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
          </a>
        </div>
      </nav>

      {mobileMenu}

      <EnrollmentModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => true}
        contextLabel="سجّل بإيميلك — بعد الدخول اختار الكورس من الصفحة الرئيسية."
      />
    </header>
  );
}
