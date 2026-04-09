"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { Mode } from "@/lib/types";

type ModeContextValue = {
  mode: Mode;
  toggle: () => void;
  setMode: (mode: Mode) => void;
  isBusiness: boolean;
  isDeveloper: boolean;
};

const ModeContext = createContext<ModeContextValue>({
  mode: "business",
  toggle: () => {},
  setMode: () => {},
  isBusiness: true,
  isDeveloper: false,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("business");

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "business" ? "developer" : "business"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  return (
    <ModeContext.Provider
      value={{
        mode,
        toggle,
        setMode,
        isBusiness: mode === "business",
        isDeveloper: mode === "developer",
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
