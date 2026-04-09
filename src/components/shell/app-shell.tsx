"use client";

import { HeaderBar } from "@/components/shell/header-bar";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { useUIStore } from "@/lib/state/ui-store";

export function AppShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  const timelineOpen = useUIStore((state) => state.timelineOpen);

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar title={title} />
      <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="border-r border-border bg-surface">
          <SidebarNav />
        </aside>
        <main className="bank-grid px-5 py-5">{children}</main>
        <aside className="border-l border-border bg-surface p-5">{timelineOpen ? <ActivityTimeline /> : null}</aside>
      </div>
    </div>
  );
}
