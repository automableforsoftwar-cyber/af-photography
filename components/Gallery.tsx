"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { gallery, type GalleryItem } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";

const spanClass: Record<GalleryItem["span"], string> = {
  tall: "aspect-[3/4]",
  wide: "aspect-[4/3] sm:aspect-[16/10]",
  square: "aspect-square",
};

export function Gallery() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = gallery.findIndex((item) => item.id === activeId);
  const active = activeIndex >= 0 ? gallery[activeIndex] : null;

  const close = useCallback(() => setActiveId(null), []);

  const showNext = useCallback(() => {
    setActiveId((current) => {
      if (!current) return current;
      const index = gallery.findIndex((item) => item.id === current);
      return gallery[(index + 1) % gallery.length].id;
    });
  }, []);

  const showPrev = useCallback(() => {
    setActiveId((current) => {
      if (!current) return current;
      const index = gallery.findIndex((item) => item.id === current);
      return gallery[(index - 1 + gallery.length) % gallery.length].id;
    });
  }, []);

  useEffect(() => {
    if (!active) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrev();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, showNext, showPrev]);

  return (
    <section
      id="gallery"
      className="relative scroll-mt-24 border-y border-white/10 bg-white/5 py-24 backdrop-blur-md sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeader
          kicker="المعرض"
          title="صور التقطناها."
          description="مختارات احترافية من مجتمع AF — طبيعة، بورتريه، استوديو، ومدن."
        />

        <div className="mt-16 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {gallery.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              className="group relative mb-4 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-white/10 text-start shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              onClick={() => setActiveId(item.id)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 32px rgba(251,191,36,0.18)",
              }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.55,
                delay: (index % 3) * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-label={`فتح ${item.title}`}
            >
              <div className={`relative ${spanClass[item.span]}`}>
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-[#050505]/15 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 opacity-90 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-xs font-medium text-yellow-400">
                    {item.category}
                  </p>
                  <p className="font-display mt-1 text-2xl font-bold leading-snug text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-normal text-slate-400">
                    {item.author}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
            onClick={close}
          >
            <button
              type="button"
              className="absolute end-5 top-5 text-sm font-medium text-slate-200 hover:text-yellow-400"
              onClick={close}
            >
              قفل
            </button>

            <motion.figure
              className="relative w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 sm:aspect-[16/10]">
                <Image
                  src={active.image.src}
                  alt={active.image.alt}
                  fill
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                  priority
                />
              </div>
              <figcaption className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-yellow-400">
                    {active.category}
                  </p>
                  <h3
                    id="lightbox-title"
                    className="font-display mt-2 text-3xl font-bold leading-snug text-white"
                  >
                    {active.title}
                  </h3>
                  <p className="mt-1 font-normal text-slate-400">
                    {active.author}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={showPrev}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-yellow-400/50 hover:text-yellow-400"
                  >
                    اللي فات
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-yellow-400/50 hover:text-yellow-400"
                  >
                    اللي جاي
                  </button>
                </div>
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
