"use client";

import { Reveal } from "@/components/ui/Reveal";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  kicker,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const alignment =
    align === "center" ? "mx-auto text-center items-center" : "items-start";

  return (
    <Reveal className={`flex max-w-2xl flex-col ${alignment}`}>
      <p className="kicker">{kicker}</p>
      <h2 className="font-display text-blend mt-4 text-balance text-4xl font-bold leading-snug sm:text-5xl lg:text-[3.4rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-xl text-base font-normal leading-loose text-slate-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
