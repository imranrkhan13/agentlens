import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("flex h-10 w-full rounded-xl border border-white/[.09] bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-[#686777] focus:border-violet/60 focus:ring-2 focus:ring-violet/15", className)}
    {...props}
  />
));
Input.displayName = "Input";
