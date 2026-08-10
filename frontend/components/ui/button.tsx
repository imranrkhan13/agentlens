import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#e9ae39] text-[#302612] shadow-[0_8px_28px_rgba(218,159,45,.22)] hover:-translate-y-0.5 hover:bg-[#f3bd50]",
        secondary: "border border-[#ded8c8] bg-[#fffdf7] text-[#4a463b] hover:border-[#c9b995] hover:bg-[#fbf1d9]",
        ghost: "text-[#6f6a5e] hover:bg-[#f5efdf] hover:text-[#2f2d22]",
        danger: "border border-danger/25 bg-danger/10 text-[#ff9999] hover:bg-danger/15",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4", lg: "h-11 px-5" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
