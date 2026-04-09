import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "focus-ring h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
