"use client";

import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUIStore } from "@/lib/state/ui-store";
import type { ConnectionCardState } from "@/lib/types/domain";

export function ConnectionCard({
  connection
}: {
  connection: ConnectionCardState;
}) {
  const pushToast = useUIStore((state) => state.pushToast);

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: connection.provider })
      });
      return (await response.json()) as { result: { message: string; status: string } };
    },
    onSuccess: (data) => {
      pushToast({
        title: `${connection.title} checked`,
        description: data.result.message,
        variant: data.result.status === "success" ? "success" : data.result.status === "warning" ? "warning" : "danger"
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title">{connection.provider}</p>
            <h3 className="mt-2 text-lg font-semibold text-text">{connection.title}</h3>
          </div>
          <Badge variant={connection.status === "connected" ? "success" : connection.status === "warning" ? "warning" : "danger"}>
            {connection.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-muted">{connection.description}</p>
        <div className="rounded-xl border border-border/70 bg-muted-surface p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Required keys</p>
          <p className="mt-2 text-sm text-text">{connection.envKeys.join(", ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: "Configuration drawer", description: `Open ${connection.title} configuration.` })}>
            Configure
          </Button>
          <Button size="sm" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
