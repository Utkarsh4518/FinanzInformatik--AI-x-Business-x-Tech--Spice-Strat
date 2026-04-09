import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "focus-ring min-h-[140px] w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text placeholder:text-text-muted",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
