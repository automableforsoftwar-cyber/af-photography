"use client";

import { PremiumButton } from "@/components/ui/PremiumButton";

type GalleryRevealButtonProps = {
  open: boolean;
  onToggle: () => void;
};

export function GalleryRevealButton({ open, onToggle }: GalleryRevealButtonProps) {
  return (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <p className="kicker">{open ? "المعرض مفتوح" : "شغل الطلاب"}</p>
        <h2 className="font-display text-blend mt-4 text-center text-3xl font-bold leading-snug sm:text-4xl">
          {open ? "خبّي معرض الطلاب" : "شوف الطلاب بيعملوا إيه"}
        </h2>
        <PremiumButton
          onClick={onToggle}
          className="mt-8"
          aria-expanded={open}
          aria-controls="gallery"
        >
          {open ? "خبّي المعرض" : "ورّيني معرض الطلاب"}
          <span aria-hidden="true">{open ? "↑" : "↓"}</span>
        </PremiumButton>
      </div>
    </div>
  );
}
