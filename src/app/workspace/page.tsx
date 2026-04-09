"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AnalysisResultCard } from "@/components/workspace/analysis-result-card";
import { AmbiguityCard } from "@/components/workspace/ambiguity-card";
import { RequirementInputPanel } from "@/components/workspace/requirement-input-panel";
import { SharedSpecCard } from "@/components/workspace/shared-spec-card";
import { VoiceCaptureCard } from "@/components/voice/voice-capture-card";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import type { AmbiguityFinding, RequirementAnalysis, SharedSpec } from "@/lib/types/domain";

export default function WorkspacePage() {
  const analysis = useWorkspaceStore((state) => state.analysis);
  const spec = useWorkspaceStore((state) => state.spec);
  const setAnalysis = useWorkspaceStore((state) => state.setAnalysis);
  const setSpec = useWorkspaceStore((state) => state.setSpec);
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const addVoiceSession = useWorkspaceStore((state) => state.addVoiceSession);

  const analysisCards = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return [
      { title: "Business Summary", content: [analysis.summary] },
      { title: "User Story", content: [analysis.userStory] },
      { title: "Acceptance Criteria", content: analysis.acceptanceCriteria },
      { title: "Edge Cases", content: analysis.edgeCases },
      { title: "Out of Scope", content: analysis.outOfScope },
      { title: "Suggested UI Behavior", content: analysis.uiSuggestions },
      { title: "Technical Impact Summary", content: analysis.technicalImpactSummary },
      { title: "Test Ideas", content: analysis.tests }
    ];
  }, [analysis]);

  function updateAmbiguity(updated: AmbiguityFinding) {
    if (!analysis) {
      return;
    }

    setAnalysis({
      ...analysis,
      ambiguities: analysis.ambiguities.map((item) => (item.id === updated.id ? updated : item))
    });
  }

  return (
    <AppShell title="Requirement Studio">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Requirement Studio" }]} />
      <div className="grid gap-5 2xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <RequirementInputPanel onAnalysis={(next) => setAnalysis(next)} onSpec={(next) => setSpec(next)} />
          {analysisCards.map((card) => (
            <AnalysisResultCard
              key={card.title}
              title={card.title}
              content={card.content}
              onRegenerate={() => setAnalysis({ ...(analysis as RequirementAnalysis) })}
            />
          ))}
          <div className="space-y-4">
            <p className="section-title">Ambiguity Radar</p>
            {analysis?.ambiguities.map((ambiguity) => (
              <AmbiguityCard key={ambiguity.id} ambiguity={ambiguity} onUpdate={updateAmbiguity} />
            )) ?? <p className="text-sm text-text-muted">Run analysis to detect vague phrases and missing information.</p>}
          </div>
        </div>
        <div className="space-y-5">
          <SharedSpecCard
            spec={spec}
            onStatusChange={(approvalStatus) =>
              spec && setSpec({ ...spec, approvalStatus, updatedAt: new Date().toISOString() } as SharedSpec)
            }
          />
          <VoiceCaptureCard
            title="Live Discussion Mode"
            description="Record an active meeting, stream the transcript into the app, and save decisions, open questions, risks, and next tasks to workspace history."
            mode="session"
            workspaceId={workspace.id}
            actionLabel="Save Live Discussion"
            onSessionCreated={(session) => addVoiceSession(session)}
          />
        </div>
      </div>
    </AppShell>
  );
}
