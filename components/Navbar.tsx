"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { navLinks, site } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"
        aria-label="رئيسي"
      >
        <a href="#main" className="group flex items-center gap-3">
          <Image
            src="/images/af-mark.svg"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="leading-tight text-start">
            <span className="block font-display text-base font-bold text-yellow-400 sm:text-lg">
              {site.name}
            </span>
            <span className="hidden text-[0.7rem] font-medium text-slate-400 sm:block">
              {site.fullName} · {site.project}
            </span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
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

        <div className="flex items-center gap-4">
          {hydrated && isLoggedIn ? (
            <>
              <Link
                href="/course-dashboard"
                className="hidden text-sm font-medium text-yellow-400 transition-colors hover:text-yellow-300 sm:inline"
              >
                لوحة التعلم
              </Link>
              <AuthButton appearance="plain" />
            </>
          ) : (
            <a
              href="#curriculum"
              className="text-sm font-medium text-slate-200 transition-colors hover:text-yellow-400"
            >
              اشترك
            </a>
          )}
          <button
            type="button"
            className="relative z-50 flex h-10 w-10 items-center justify-center lg:hidden"
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
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-center bg-[#050505]/90 px-8 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ul className="flex flex-col gap-7">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.45 }}
                >
                  <a
                    href={link.href}
                    className="font-display text-4xl font-bold leading-snug text-white"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
