import { cn } from "@/lib/utils";

const styles = {
  neutral: "border-border bg-muted-surface text-text",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  primary: "border-primary/20 bg-primary/10 text-primary"
} as const;

export function Badge({
  children,
  variant = "neutral",
  className
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
