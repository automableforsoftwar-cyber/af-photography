"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PremiumLink } from "@/components/ui/PremiumButton";
import { hero } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative flex min-h-svh items-end overflow-hidden bg-[#050505]">
      <div className="absolute inset-0">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-black/40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-36 text-start sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
        <motion.p
          className="text-xs font-medium tracking-[0.18em] text-yellow-400"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          {hero.kicker}
        </motion.p>

        <motion.h1
          className="font-display mt-6 max-w-5xl text-balance text-[2.05rem] font-bold leading-snug text-white sm:text-5xl lg:text-[3.6rem]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.1, ease }}
        >
          {hero.headline}
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-base font-normal leading-relaxed text-slate-300 sm:text-lg"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease }}
        >
          {hero.description}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.34, ease }}
        >
          <PremiumLink href={hero.ctaHref} variant="primary">
            {hero.cta}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              →
            </span>
          </PremiumLink>
          <PremiumLink href={hero.secondaryHref} variant="glass" className="!border-yellow-400/50 !bg-transparent !text-yellow-400 !shadow-none hover:!bg-yellow-400/10">
            {hero.secondaryCta}
          </PremiumLink>
        </motion.div>

        <motion.dl
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden border-t border-white/10 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {hero.stats.map((stat) => (
            <div key={stat.value} className="py-6 sm:pe-8">
              <dd className="font-display text-base font-bold leading-snug text-yellow-400 sm:text-lg">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
