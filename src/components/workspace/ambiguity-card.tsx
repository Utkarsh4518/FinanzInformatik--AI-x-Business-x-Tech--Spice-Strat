"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useUIStore } from "@/lib/state/ui-store";
import type { AmbiguityFinding } from "@/lib/types/domain";

export function AmbiguityCard({
  ambiguity,
  onUpdate
}: {
  ambiguity: AmbiguityFinding;
  onUpdate: (ambiguity: AmbiguityFinding) => void;
}) {
  const [draft, setDraft] = useState(ambiguity.response ?? ambiguity.suggestedClarification);
  const pushToast = useUIStore((state) => state.pushToast);

  return (
    <Card className="border-l-4 border-l-warning">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">{ambiguity.phrase}</p>
            <p className="text-sm text-text-muted">{ambiguity.whyItMatters}</p>
          </div>
          <Badge variant={ambiguity.severity === "high" ? "danger" : ambiguity.severity === "medium" ? "warning" : "neutral"}>
            {ambiguity.severity}
          </Badge>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Suggested clarification</p>
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate({ ...ambiguity, status: "accepted", response: draft });
              pushToast({ title: "Clarification accepted", description: ambiguity.phrase, variant: "success" });
            }}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onUpdate({ ...ambiguity, status: "edited", response: draft });
              pushToast({ title: "Clarification updated", description: "The ambiguity response was edited." });
            }}
          >
            Edit Response
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onUpdate({ ...ambiguity, status: "rejected", response: draft });
              pushToast({ title: "Clarification rejected", description: "This ambiguity was marked as non-blocking.", variant: "warning" });
            }}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
