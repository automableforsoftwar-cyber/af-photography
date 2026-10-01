"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ImageLightboxProps = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").filter(Boolean).pop();
    if (last && /\.[a-z0-9]+$/i.test(last)) {
      return decodeURIComponent(last);
    }
  } catch {
    /* ignore */
  }
  return `afp-image-${Date.now()}.jpg`;
}

/** Full-screen image viewer — click outside or X to close. */
export function ImageLightbox({ src, alt = "", onClose }: ImageLightboxProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    setDownloadError(null);
    setDownloading(false);
  }, [src]);

  const downloadImage = useCallback(async () => {
    if (!src || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(src, { mode: "cors", cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileNameFromUrl(src);
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("image download:", error);
      setDownloadError("مقدرناش ننزّل الصورة. حاول تاني.");
    } finally {
      setDownloading(false);
    }
  }, [src, downloading]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {src ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة"
        >
          <div className="absolute end-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void downloadImage();
              }}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#050505] shadow-[0_0_24px_rgba(251,191,36,0.25)] transition hover:bg-yellow-300 disabled:opacity-60"
              aria-label="تنزيل الصورة"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {downloading ? "جاري التنزيل…" : "تنزيل الصورة"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-lg text-white transition hover:border-yellow-400/50 hover:text-yellow-400"
              aria-label="قفل"
            >
              ✕
            </button>
          </div>

          {downloadError ? (
            <p
              role="alert"
              className="absolute bottom-6 start-1/2 z-10 -translate-x-1/2 rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm text-red-200"
              onClick={(e) => e.stopPropagation()}
            >
              {downloadError}
            </p>
          ) : null}

          <motion.div
            className="relative flex h-[min(90svh,900px)] w-full max-w-5xl items-center justify-center"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
