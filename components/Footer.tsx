import { site } from "@/lib/content";

/** Minimal public footer — brand + copyright only (server component). */
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 overflow-x-hidden px-5 py-10 text-center sm:flex-row sm:px-8 sm:text-start lg:px-10">
        <div>
          <p className="font-display text-lg font-bold text-yellow-400">
            {site.name}
          </p>
          <p className="mt-1 text-sm text-slate-400">{site.fullName}</p>
        </div>
        <p className="text-sm text-slate-500">AF P © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
