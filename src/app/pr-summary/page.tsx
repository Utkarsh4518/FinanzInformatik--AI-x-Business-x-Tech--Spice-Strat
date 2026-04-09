"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { consumeEventStream } from "@/lib/client/stream";
import { buildDiffCards, DiffExplainerCard } from "@/components/pr/diff-explainer-card";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoicePlaybackButton } from "@/components/voice/voice-playback-button";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import { copyToClipboard } from "@/lib/utils";
import type { DiffExplanation } from "@/lib/types/domain";

export default function PRSummaryPage() {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const roleMode = useWorkspaceStore((state) => state.roleMode);
  const explanation = useWorkspaceStore((state) => state.diffExplanation);
  const setDiffExplanation = useWorkspaceStore((state) => state.setDiffExplanation);
  const pushToast = useUIStore((state) => state.pushToast);
  const [prUrl, setPrUrl] = useState("https://github.com/demo-bank/loan-portal/pull/194");
  const [commitRange, setCommitRange] = useState("6af243..7bc991");
  const [rawDiff, setRawDiff] = useState(explanation?.changedFiles.join("\n") ?? "");
  const [events, setEvents] = useState<string[]>([]);

  const explainMutation = useMutation({
    mutationFn: async () => {
      setEvents([]);
      const response = await fetch("/api/diff/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, prUrl, rawDiff, commitRange, roleMode })
      });
      await consumeEventStream<DiffExplanation>(response, (event) => {
        setEvents((current) => [...current, event.message]);
        if (event.stage === "complete" && event.payload) {
          setDiffExplanation(event.payload);
          pushToast({ title: "PR explanation ready", description: "Business and technical summaries were updated.", variant: "success" });
        }
        if (event.stage === "error") {
          pushToast({ title: "PR explanation failed", description: event.message, variant: "danger" });
        }
      });
    },
    onError: (error) => {
      pushToast({ title: "PR explanation failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const cards = useMemo(() => buildDiffCards(explanation), [explanation]);

  return (
    <AppShell title="PR Explainer">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "PR Explainer" }]} />
      <div className="space-y-5">
        <Card>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px]">
            <Input value={prUrl} onChange={(event) => setPrUrl(event.target.value)} placeholder="PR URL" />
            <Input value={commitRange} onChange={(event) => setCommitRange(event.target.value)} placeholder="Commit hash range" />
            <Button onClick={() => explainMutation.mutate()} disabled={explainMutation.isPending}>
              Explain Changes
            </Button>
          </CardContent>
        </Card>

        <Textarea value={rawDiff} onChange={(event) => setRawDiff(event.target.value)} placeholder="Or paste raw git diff" />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!explanation) return;
              await copyToClipboard(explanation.executiveSummary);
              pushToast({ title: "Product Owner summary copied", variant: "success" });
            }}
          >
            Copy for Product Owner
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!explanation) return;
              await copyToClipboard(explanation.businessValue.join("\n"));
              pushToast({ title: "Slack summary copied", variant: "success" });
            }}
          >
            Copy for Slack
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!explanation) return;
              await copyToClipboard(explanation.technicalChanges.join("\n"));
              pushToast({ title: "Jira comment copied", variant: "success" });
            }}
          >
            Copy for Jira comment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!explanation) return;
              await copyToClipboard(explanation.releaseNote);
              pushToast({ title: "Release note copied", variant: "success" });
            }}
          >
            Copy for release note
          </Button>
        </div>

        {events.length > 0 ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              {events.map((event) => (
                <div key={event} className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
                  {event}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          {cards.map((card) => (
            <DiffExplainerCard key={card.title} title={card.title} items={card.items} />
          ))}
        </div>

        {explanation ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <VoicePlaybackButton
              cacheKey="pr-summary-voice"
              label="Play PR Summary"
              text={explanation.executiveSummary}
              quality="fast"
            />
            <VoicePlaybackButton
              cacheKey="release-note-voice"
              label="Generate Voice Release Note"
              text={explanation.releaseNote}
              quality="high"
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
