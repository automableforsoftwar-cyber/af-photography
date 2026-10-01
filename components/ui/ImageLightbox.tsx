"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

type ImageLightboxProps = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

/** Full-screen image viewer — click outside or X to close. */
export function ImageLightbox({ src, alt = "", onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute end-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-lg text-white transition hover:border-yellow-400/50 hover:text-yellow-400"
            aria-label="قفل"
          >
            ✕
          </button>
          <motion.div
            className="relative h-[min(90svh,900px)] w-full max-w-5xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
              priority
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
