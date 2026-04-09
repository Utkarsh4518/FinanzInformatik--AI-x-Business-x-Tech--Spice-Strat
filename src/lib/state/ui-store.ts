"use client";

import { create } from "zustand";
import { createId } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

type UIState = {
  timelineOpen: boolean;
  commandPaletteOpen: boolean;
  toasts: Toast[];
  setTimelineOpen: (timelineOpen: boolean) => void;
  setCommandPaletteOpen: (commandPaletteOpen: boolean) => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  timelineOpen: true,
  commandPaletteOpen: false,
  toasts: [],
  setTimelineOpen: (timelineOpen) => set({ timelineOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: createId("toast") }]
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));
