"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { LandingPage } from "@/components/landing-page";
import type { Mode } from "@/lib/types";

const DashboardShell = dynamic(
  () => import("@/components/dashboard-shell").then((m) => m.DashboardShell),
  { ssr: false },
);

export default function Home() {
  const { setMode } = useMode();
  const [entered, setEntered] = useState(false);

  function handleSelect(mode: Mode) {
    setMode(mode);
    setEntered(true);
  }

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <LandingPage onSelect={handleSelect} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-screen"
        >
          <DashboardShell />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
