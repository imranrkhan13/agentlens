"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-bg hover:bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_30px_-8px_rgba(110,86,207,0.6)]",
  secondary: "glass text-ink hover:bg-white/[0.06]",
  ghost: "text-muted hover:text-ink",
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
