"use client";

import { site } from "@/lib/content";

/** Minimal public footer — brand + copyright only. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-center sm:flex-row sm:px-8 sm:text-start lg:px-10">
        <div>
          <p className="font-display text-lg font-bold text-yellow-400">
            {site.name}
          </p>
          <p className="mt-1 text-sm text-slate-400">{site.fullName}</p>
        </div>
        <p className="text-sm text-slate-500">
          AF P {year} ©
        </p>
      </div>
    </footer>
  );
}
