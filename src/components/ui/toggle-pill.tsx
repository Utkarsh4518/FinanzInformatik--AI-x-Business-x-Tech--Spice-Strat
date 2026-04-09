import { cn } from "@/lib/utils";

export function TogglePill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted hover:bg-muted-surface"
      )}
    >
      {children}
    </button>
  );
}
