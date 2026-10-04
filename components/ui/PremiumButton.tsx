"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "border-yellow-400/60 bg-yellow-400 text-[#050505]",
  glass:
    "border-yellow-400/35 bg-white/8 text-slate-200",
  ghost:
    "border-white/15 bg-white/5 text-slate-200",
} as const;

const sizes = {
  sm: "px-3.5 py-1.5 text-sm font-medium tracking-normal",
  md: "px-6 py-3 text-[0.92rem] font-medium tracking-normal",
} as const;

type PremiumButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function PremiumButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: PremiumButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type PremiumLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function PremiumLink({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: PremiumLinkProps) {
  return (
    <a
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
