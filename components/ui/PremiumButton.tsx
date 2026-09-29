"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const variants = {
  primary:
    "border-yellow-400/60 bg-yellow-400 text-[#050505] shadow-[0_0_28px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]",
  glass:
    "border-yellow-400/35 bg-white/8 text-slate-200 shadow-[0_0_24px_rgba(251,191,36,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]",
  ghost:
    "border-white/15 bg-white/5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
} as const;

const sizes = {
  sm: "px-3.5 py-1.5 text-sm font-medium tracking-normal",
  md: "px-6 py-3 text-[0.92rem] font-medium tracking-normal",
} as const;

type PremiumButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
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
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease }}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium backdrop-blur-xl disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type PremiumLinkProps = Omit<HTMLMotionProps<"a">, "children"> & {
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
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease }}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium backdrop-blur-xl ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.a>
  );
}
