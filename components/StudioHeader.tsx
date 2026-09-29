"use client";

import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { site } from "@/lib/content";

type StudioHeaderProps = {
  eyebrow?: string;
  title: string;
};

export function StudioHeader({ eyebrow, title }: StudioHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-background/35 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg font-bold text-af-white sm:text-xl">
            {site.name}
          </Link>
          <div className="hidden sm:block">
            {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
            <p className="text-sm font-medium text-slate-400">
              {title}
            </p>
          </div>
        </div>
        <AuthButton />
      </div>
    </header>
  );
}
