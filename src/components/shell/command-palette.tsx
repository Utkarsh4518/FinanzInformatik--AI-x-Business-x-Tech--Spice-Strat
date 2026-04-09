"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { navItems } from "@/lib/constants";
import { useUIStore } from "@/lib/state/ui-store";

export function CommandPalette() {
  const open = useUIStore((state) => state.commandPaletteOpen);
  const setOpen = useUIStore((state) => state.setCommandPaletteOpen);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [setOpen]);

  const shortcuts = useMemo(
    () => [
      { label: "Open Dashboard", href: "/" },
      { label: "Start New Requirement", href: "/workspace" },
      { label: "Load Demo Mode", href: "/demo" }
    ],
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="mb-4 block text-lg font-semibold text-text">Global command palette</DialogTitle>
        <div className="space-y-2">
          {[...shortcuts, ...navItems.map((item) => ({ label: item.label, href: item.href }))].map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              onClick={() => setOpen(false)}
              className="focus-ring flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-text transition-colors hover:bg-muted-surface"
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-wide text-text-muted">{item.href}</span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
