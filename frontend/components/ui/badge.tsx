import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-fi-magenta/20 bg-fi-magenta/10 px-2 py-0.5 text-[11px] font-medium text-fi-text/60",
        className,
      )}
      {...props}
    />
  );
}
