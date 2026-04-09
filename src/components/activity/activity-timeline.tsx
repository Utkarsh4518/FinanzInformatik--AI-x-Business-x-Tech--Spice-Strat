"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VoiceHistoryPanel } from "@/components/voice/voice-history-panel";
import { useWorkspaceStore } from "@/lib/state/workspace-store";

export function ActivityTimeline() {
  const activity = useWorkspaceStore((state) => state.activity);

  return (
    <div className="space-y-5">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Activity Timeline</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Decision and delivery log</h3>
            </div>
            <Badge variant="primary">{activity.length} events</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activity.map((event) => (
            <div key={event.id} className="rounded-xl border border-border/70 bg-muted-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge
                  variant={
                    event.stage === "error"
                      ? "danger"
                      : event.stage === "complete"
                        ? "success"
                        : event.stage === "progress"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {event.type}
                </Badge>
                <span className="text-xs uppercase tracking-wide text-text-muted">
                  {format(new Date(event.timestamp), "dd MMM HH:mm")}
                </span>
              </div>
              <p className="text-sm text-text">{event.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <VoiceHistoryPanel />
    </div>
  );
}
