"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#e9ae39] text-[#302612] hover:bg-[#f3bd50] shadow-[0_8px_28px_rgba(218,159,45,.22)]",
  secondary: "border border-[#ded8c8] bg-[#fffdf7] text-[#4a463b] hover:bg-[#fbf1d9]",
  ghost: "text-[#6f6a5e] hover:text-[#2f2d22]",
};

const sizes: Record<Size, string> = {
  default: "px-5 py-2.5 text-[14px]",
  lg: "px-7 py-3.5 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  ...props
}: HTMLMotionProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
