"use client";

import { navLinks, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p className="font-display text-2xl font-bold text-white sm:text-3xl">
            {site.name}
          </p>
          <p className="mt-2 max-w-sm text-sm font-medium text-slate-400">
            {site.tagline}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {site.founder} ({site.founderEn}) · {site.founderRole}
          </p>
        </div>

        <nav aria-label="التذييل">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-yellow-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm font-normal text-slate-400">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
