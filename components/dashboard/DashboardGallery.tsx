"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { gallery } from "@/lib/content";
import { RtlScroll } from "@/components/ui/RtlScroll";

const ease = [0.22, 1, 0.36, 1] as const;

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

const spanClass = {
  tall: "aspect-[3/4]",
  wide: "aspect-[4/3] sm:aspect-[16/10]",
  square: "aspect-square",
} as const;

export function DashboardGallery() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = gallery.find((g) => g.id === activeId) ?? null;

  return (
    <RtlScroll className="h-full pe-4">
      <section aria-labelledby="gallery-heading" className="pb-16">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-wide text-yellow-400">
            المعرض
          </p>
          <h2
            id="gallery-heading"
            className="mt-2 font-display text-3xl font-bold text-white"
          >
            صور التقطناها
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            مختارات بصرية من جلسات AF — طبيعة، بورتريه، ومدن.
          </p>
        </div>

        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="columns-1 gap-4 sm:columns-2 lg:columns-3"
        >
          {gallery.map((photo) => (
            <motion.button
              key={photo.id}
              type="button"
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveId(photo.id)}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-start shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <span className={`relative block ${spanClass[photo.span]}`}>
                <Image
                  src={photo.image.src}
                  alt={photo.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-sm font-medium text-white">
                    {photo.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-yellow-400/90">
                    {photo.category}
                  </span>
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {active ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setActiveId(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease }}
            className="relative max-h-[85svh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={active.image.src}
                alt={active.image.alt}
                fill
                quality={100}
                className="object-cover"
                sizes="90vw"
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-white">{active.title}</p>
                <p className="text-xs text-yellow-400">{active.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:border-yellow-400/40 hover:text-yellow-400"
              >
                قفل
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </RtlScroll>
  );
}
