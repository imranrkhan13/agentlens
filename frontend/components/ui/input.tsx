import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("flex h-10 w-full rounded-xl border border-[#d8d6cc] bg-[#fffef9] px-3 text-sm text-[#24261f] outline-none transition placeholder:text-[#9a9b93] hover:border-[#bebdb4] focus:border-[#8ca525] focus:ring-4 focus:ring-[#d9ff57]/20", className)}
    {...props}
  />
));
Input.displayName = "Input";
