"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { consumeEventStream } from "@/lib/client/stream";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlignmentMatrix } from "@/components/alignment/alignment-matrix";
import { VoiceCaptureCard } from "@/components/voice/voice-capture-card";
import { VoicePlaybackButton } from "@/components/voice/voice-playback-button";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import type { AlignmentReport } from "@/lib/types/domain";

export default function AlignmentPage() {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const spec = useWorkspaceStore((state) => state.spec);
  const alignment = useWorkspaceStore((state) => state.alignment);
  const setAlignment = useWorkspaceStore((state) => state.setAlignment);
  const addVoiceComment = useWorkspaceStore((state) => state.addVoiceComment);
  const pushToast = useUIStore((state) => state.pushToast);
  const [prUrl, setPrUrl] = useState("https://github.com/demo-bank/loan-portal/pull/194");
  const [commitRange, setCommitRange] = useState("6af243..7bc991");
  const [diffText, setDiffText] = useState(alignment?.sourceDiff ?? "");
  const [events, setEvents] = useState<string[]>([]);

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!spec) {
        throw new Error("Generate a shared spec before running alignment.");
      }

      setEvents([]);
      const response = await fetch("/api/alignment/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, spec, diffText })
      });
      await consumeEventStream<AlignmentReport>(response, (event) => {
        setEvents((current) => [...current, event.message]);
        if (event.stage === "complete" && event.payload) {
          setAlignment(event.payload);
          pushToast({ title: "Alignment check complete", description: "Coverage and gaps were refreshed.", variant: "success" });
        }
        if (event.stage === "error") {
          pushToast({ title: "Alignment check failed", description: event.message, variant: "danger" });
        }
      });
    },
    onError: (error) => {
      pushToast({ title: "Alignment check failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const summaryCards = useMemo(() => {
    if (!alignment) {
      return [];
    }

    return [
      { label: "Coverage Score", value: `${alignment.coverageScore}%`, variant: "success" as const },
      { label: "Fully Implemented", value: alignment.fullyImplementedItems.length, variant: "success" as const },
      { label: "Partially Implemented", value: alignment.partiallyImplementedItems.length, variant: "warning" as const },
      { label: "Missing Items", value: alignment.missingItems.length, variant: "danger" as const }
    ];
  }, [alignment]);

  return (
    <AppShell title="Alignment Checker">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Alignment Checker" }]} />
      <div className="space-y-5">
        <Card>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
            <Input value={prUrl} onChange={(event) => setPrUrl(event.target.value)} placeholder="PR URL" />
            <Input value={commitRange} onChange={(event) => setCommitRange(event.target.value)} placeholder="Optional commit range" />
            <Button onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}>
              Run Alignment Check
            </Button>
          </CardContent>
        </Card>

        <Textarea value={diffText} onChange={(event) => setDiffText(event.target.value)} placeholder="Paste PR diff or raw commit diff" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="space-y-3">
                <Badge variant={card.variant}>{card.label}</Badge>
                <div className="text-3xl font-semibold text-text">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length > 0 ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text">Live alignment progress</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((event) => (
                <div key={event} className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
                  {event}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {alignment ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text">Coverage and risk findings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  ["Fully Implemented Items", alignment.fullyImplementedItems],
                  ["Partially Implemented Items", alignment.partiallyImplementedItems],
                  ["Missing Items", alignment.missingItems],
                  ["Assumptions Made by Developer", alignment.assumptions],
                  ["Potential Business Risks", alignment.businessRisks],
                  ["Potential UX Risks", alignment.uxRisks],
                  ["Test Coverage Gaps", alignment.testCoverageGaps],
                  ["Suggested Follow-up Questions", alignment.followUpQuestions]
                ].map(([title, items]) => (
                  <div key={title as string} className="rounded-xl border border-border/70 bg-muted-surface p-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">{title as string}</p>
                    <div className="space-y-2">
                      {(items as string[]).map((item) => (
                        <p key={item} className="text-sm text-text">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <AlignmentMatrix report={alignment} />
          </div>
        ) : null}

        {alignment ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <VoicePlaybackButton
              cacheKey="alignment-risks-voice"
              label="Listen to Risk Report"
              text={alignment.businessRisks.concat(alignment.uxRisks).join(" ")}
              quality="high"
            />
            <VoiceCaptureCard
              title="Voice-based Review Loop"
              description="Record reviewer or product owner feedback, request corrections, and attach spoken notes to the alignment review."
              mode="comment"
              workspaceId={workspace.id}
              ticketId={`${workspace.id}:alignment`}
              actionLabel="Record Reviewer Feedback"
              createdBy="Reviewer"
              summaryMode="business"
              correctionRequested={true}
              correctionReason="Alignment review requested follow-up changes."
              onCommentCreated={(comment) => addVoiceComment(comment)}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
