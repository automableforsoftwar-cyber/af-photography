"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PremiumLink } from "@/components/ui/PremiumButton";
import { enroll } from "@/lib/content";

export function FinalCTA() {
  return (
    <section
      id="enroll"
      className="relative mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10"
    >
      <div className="relative min-h-[28rem] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:min-h-[32rem]">
        <Image
          src={enroll.image.src}
          alt={enroll.image.alt}
          fill
          quality={100}
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

        <div className="relative z-10 flex min-h-[28rem] max-w-2xl flex-col justify-end p-7 sm:min-h-[32rem] sm:p-12 lg:p-16">
          <motion.p
            className="kicker"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {enroll.kicker}
          </motion.p>
          <motion.h2
            className="font-display text-blend mt-4 text-balance text-4xl font-bold leading-snug sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.08 }}
          >
            {enroll.headline}
          </motion.h2>
          <motion.p
            className="mt-5 max-w-md text-base font-normal leading-loose text-slate-400"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.16 }}
          >
            {enroll.description}
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center gap-6"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.24 }}
          >
            <PremiumLink href="#curriculum">
              {enroll.cta}
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
              →
            </span>
            </PremiumLink>
            <span className="text-xl font-bold text-gold-soft">{enroll.price}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
