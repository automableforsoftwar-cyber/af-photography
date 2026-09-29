"use client";

import Image from "next/image";
import { mentor } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

export function Instructor() {
  return (
    <section
      id="mentor"
      className="relative mx-auto grid max-w-7xl scroll-mt-24 items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-16 lg:px-10"
    >
      <Reveal className="relative lg:col-span-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <Image
            src={mentor.image.src}
            alt={mentor.image.alt}
            fill
            quality={100}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">
          {mentor.role}
        </p>
      </Reveal>

      <div className="lg:col-span-6">
        <Reveal>
          <p className="kicker">المؤسس</p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-snug text-white sm:text-5xl lg:text-6xl">
            {mentor.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-yellow-400">
            {mentor.nameEn}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <blockquote className="mt-8 border-s border-yellow-400 ps-6 text-2xl font-medium leading-relaxed text-slate-200 sm:text-[1.7rem]">
            {mentor.quote}
          </blockquote>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-8 max-w-lg text-base text-slate-300 leading-relaxed">
            {mentor.bio}
          </p>
        </Reveal>

        <Reveal delay={0.24} className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
          {mentor.facts.map((fact) => (
            <div key={fact.label}>
              <p className="text-2xl font-bold text-gold sm:text-3xl">{fact.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {fact.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
