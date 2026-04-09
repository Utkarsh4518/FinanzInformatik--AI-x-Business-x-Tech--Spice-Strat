"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { consumeEventStream } from "@/lib/client/stream";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TogglePill } from "@/components/ui/toggle-pill";
import { VoiceCaptureCard } from "@/components/voice/voice-capture-card";
import { VoicePlaybackButton } from "@/components/voice/voice-playback-button";
import type { AnalyzeRequirementRequest, GenerateSpecRequest, StreamingEvent } from "@/lib/types/api";
import type { RequirementAnalysis, SharedSpec } from "@/lib/types/domain";

export function RequirementInputPanel({
  onAnalysis,
  onSpec
}: {
  onAnalysis: (analysis: RequirementAnalysis) => void;
  onSpec: (spec: SharedSpec) => void;
}) {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const roleMode = useWorkspaceStore((state) => state.roleMode);
  const simpleWording = useWorkspaceStore((state) => state.simpleWording);
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const setSimpleWording = useWorkspaceStore((state) => state.setSimpleWording);
  const existingAnalysis = useWorkspaceStore((state) => state.analysis);
  const pushToast = useUIStore((state) => state.pushToast);
  const [streamEvents, setStreamEvents] = useState<StreamingEvent[]>([]);
  const [draft, setDraft] = useState(workspace.requirementText);
  const [metadata, setMetadata] = useState(workspace.metadata);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setStreamEvents([]);
      const payload: AnalyzeRequirementRequest = {
        workspaceId: workspace.id,
        requirementText: draft,
        metadata,
        wordingMode: simpleWording ? "simple" : "technical",
        roleMode
      };

      const response = await fetch("/api/requirements/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      await consumeEventStream<RequirementAnalysis>(response, (event) => {
        setStreamEvents((current) => [...current, event]);
        if (event.stage === "complete" && event.payload) {
          onAnalysis(event.payload);
          pushToast({ title: "Requirement analysis complete", description: "Structured results are now available.", variant: "success" });
        }
        if (event.stage === "error") {
          pushToast({ title: "Requirement analysis failed", description: event.message, variant: "danger" });
        }
      });
    },
    onError: (error) => {
      pushToast({ title: "Requirement analysis failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const specMutation = useMutation({
    mutationFn: async () => {
      if (!existingAnalysis) {
        throw new Error("Analyze the requirement first.");
      }

      const payload: GenerateSpecRequest = {
        workspaceId: workspace.id,
        title: workspace.title,
        analysis: existingAnalysis,
        metadata
      };

      const response = await fetch("/api/spec/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { spec: SharedSpec };
      onSpec(data.spec);
      pushToast({ title: "Shared spec updated", description: "The latest agreement is now visible.", variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Spec generation failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setWorkspace({
        id: workspace.id,
        title: workspace.title,
        roleMode: workspace.roleMode,
        requirementText: draft,
        metadata,
        createdAt: workspace.createdAt,
        updatedAt: new Date().toISOString(),
        status: workspace.status,
        isDemo: workspace.isDemo
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    draft,
    metadata,
    setWorkspace,
    workspace.createdAt,
    workspace.id,
    workspace.isDemo,
    workspace.roleMode,
    workspace.status,
    workspace.title
  ]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <p className="section-title">Requirement Intake</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Requirement Studio</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Business Goal"
              value={metadata.businessGoal ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, businessGoal: event.target.value }))}
            />
            <Input
              placeholder="Success Metric"
              value={metadata.successMetric ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, successMetric: event.target.value }))}
            />
            <Input
              placeholder="Deadline"
              value={metadata.deadline ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, deadline: event.target.value }))}
            />
            <Input
              placeholder="Priority"
              value={metadata.priority ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, priority: event.target.value }))}
            />
            <Input
              placeholder="User Type"
              value={metadata.userType ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, userType: event.target.value }))}
            />
            <Input
              placeholder="Frontend Expectations"
              value={metadata.frontendExpectations ?? ""}
              onChange={(event) => setMetadata((current) => ({ ...current, frontendExpectations: event.target.value }))}
            />
          </div>
          <Input
            placeholder="Constraints"
            value={metadata.constraints ?? ""}
            onChange={(event) => setMetadata((current) => ({ ...current, constraints: event.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            <TogglePill active={simpleWording} onClick={() => setSimpleWording(true)}>
              Simple business wording
            </TogglePill>
            <TogglePill active={!simpleWording} onClick={() => setSimpleWording(false)}>
              More technical wording
            </TogglePill>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              Analyze Requirement
            </Button>
            <Button variant="secondary" onClick={() => specMutation.mutate()} disabled={specMutation.isPending}>
              Generate Shared Spec
            </Button>
            <Button variant="secondary" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              Detect Ambiguities
            </Button>
            <Button variant="secondary" onClick={() => specMutation.mutate()} disabled={specMutation.isPending}>
              Convert to Technical Tasks
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const nextWorkspace = {
                  ...workspace,
                  requirementText: draft,
                  metadata,
                  updatedAt: new Date().toISOString()
                };
                setWorkspace(nextWorkspace);
                pushToast({ title: "Workspace saved", description: "Autosave checkpoint recorded.", variant: "success" });
              }}
            >
              <Save className="size-4" />
              Save Workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      {analyzeMutation.isPending ? (
        <Card>
          <CardContent className="py-5">
            <LoadingSkeleton lines={7} />
          </CardContent>
        </Card>
      ) : null}

      {streamEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text">Live analysis stream</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {streamEvents.map((event, index) => (
              <div key={`${event.type}-${index}`} className="rounded-xl border border-border/70 bg-muted-surface p-3">
                <p className="text-xs uppercase tracking-wide text-text-muted">{event.stage}</p>
                <p className="mt-1 text-sm text-text">{event.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {!existingAnalysis && !analyzeMutation.isPending ? (
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-text-muted">
              Run the analysis to stream business summary, acceptance criteria, ambiguity prompts, technical impact, and test ideas into the shared workspace.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <VoiceCaptureCard
        title="Voice Requirement Capture"
        description="Record a spoken requirement, transcribe it with ElevenLabs, optionally translate it, and automatically generate the shared analysis and spec."
        mode="requirement"
        workspaceId={workspace.id}
        roleMode={roleMode}
        wordingMode={simpleWording ? "simple" : "technical"}
        metadata={metadata as Record<string, string | undefined>}
        actionLabel="Transcribe"
        onRequirementProcessed={(payload) => {
          if (payload.transcription.transcript) {
            setDraft(payload.transcription.transcript);
          }
          if (payload.analysis) {
            onAnalysis(payload.analysis);
          }
          if (payload.spec) {
            onSpec(payload.spec);
          }
        }}
      />

      {existingAnalysis ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <VoicePlaybackButton cacheKey="business-summary" label="Play Business Summary" text={existingAnalysis.summary} quality="fast" />
          <VoicePlaybackButton cacheKey="business-summary-hq" label="Play Summary (HQ)" text={existingAnalysis.summary} quality="high" />
        </div>
      ) : null}
    </div>
  );
}
