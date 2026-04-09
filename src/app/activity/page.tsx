"use client";

import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWorkspaceStore } from "@/lib/state/workspace-store";

export default function ActivityPage() {
  const activity = useWorkspaceStore((state) => state.activity);

  return (
    <AppShell title="Activity Log">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Activity Log" }]} />
      <Card>
        <CardHeader>
          <div>
            <p className="section-title">Audit Trail</p>
            <h2 className="mt-2 text-xl font-semibold text-text">All workspace events</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activity.map((event) => (
            <div key={event.id} className="rounded-xl border border-border/70 bg-muted-surface p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                {event.type} • {new Date(event.timestamp).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-text">{event.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
