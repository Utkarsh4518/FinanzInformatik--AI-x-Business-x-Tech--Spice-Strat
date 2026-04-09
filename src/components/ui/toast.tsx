"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/lib/state/ui-store";

export function ToastViewport() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      dismissToast(toasts[0].id);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [dismissToast, toasts]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="surface-panel px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <strong className="text-sm text-text">{toast.title}</strong>
            <Badge
              variant={
                toast.variant === "success"
                  ? "success"
                  : toast.variant === "warning"
                    ? "warning"
                    : toast.variant === "danger"
                      ? "danger"
                      : "primary"
              }
            >
              {toast.variant ?? "info"}
            </Badge>
          </div>
          {toast.description ? <p className="text-sm text-text-muted">{toast.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
