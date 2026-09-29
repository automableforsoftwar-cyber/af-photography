"use client";

import Link from "next/link";
import { PublicShowcaseGallery } from "@/components/community/PublicShowcaseGallery";
import { site } from "@/lib/content";

export function CommunityWorkspace() {
  return (
    <div className="relative min-h-svh overflow-x-clip bg-[#050505]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div>
          <p className="text-xs font-medium tracking-wide text-yellow-400">
            {site.name}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            معرض التصويت العام
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            شوف وشجّع — التصويت بعد تسجيل الدخول.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-slate-300 transition-colors hover:text-yellow-400"
        >
          الرئيسية
        </Link>
      </header>
      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="min-h-[70vh]">
          <PublicShowcaseGallery />
        </div>
      </main>
    </div>
  );
}
