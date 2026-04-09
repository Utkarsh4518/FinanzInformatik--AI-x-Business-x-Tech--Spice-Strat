"use client";

import dynamic from "next/dynamic";

const DashboardShell = dynamic(
  () => import("@/components/dashboard-shell").then((m) => m.DashboardShell),
  { ssr: false },
);

export default function Home() {
  return <DashboardShell />;
}
