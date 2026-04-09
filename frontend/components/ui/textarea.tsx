import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-fi-dark/60 px-3 py-2.5 text-sm text-fi-text placeholder:text-fi-text/30 transition-colors focus-visible:outline-none focus-visible:border-fi-magenta/30",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
