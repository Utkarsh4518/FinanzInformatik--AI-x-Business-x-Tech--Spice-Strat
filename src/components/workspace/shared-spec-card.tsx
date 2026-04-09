"use client";

import { useMemo } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { exportDeveloperChecklist, exportSpecAsGitHubIssue, exportSpecAsMarkdown, exportSpecAsPdf } from "@/lib/export/formatters";
import { copyToClipboard } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExportMenu } from "@/components/ui/export-menu";
import { Separator } from "@/components/ui/separator";
import { VoiceCaptureCard } from "@/components/voice/voice-capture-card";
import { VoicePlaybackButton } from "@/components/voice/voice-playback-button";
import { TechnicalTaskList } from "@/components/workspace/technical-task-list";
import type { SharedSpec } from "@/lib/types/domain";
import { resolveVoiceAssetUrl } from "@/lib/voice/asset-url";

export function SharedSpecCard({
  spec,
  onStatusChange
}: {
  spec: SharedSpec | null;
  onStatusChange: (status: SharedSpec["approvalStatus"]) => void;
}) {
  const pushToast = useUIStore((state) => state.pushToast);
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const voiceComments = useWorkspaceStore((state) => state.voiceComments);
  const addVoiceComment = useWorkspaceStore((state) => state.addVoiceComment);
  const lastClarification = voiceComments.find((comment) => comment.ticketId === `${workspace.id}:spec`);

  const sections = useMemo(() => {
    if (!spec) {
      return [];
    }

    return [
      { title: "Feature Name", items: [spec.featureName] },
      { title: "Business Intent", items: [spec.businessIntent] },
      { title: "User Story", items: [spec.userStory] },
      { title: "Inputs", items: spec.inputs },
      { title: "Outputs", items: spec.outputs },
      { title: "Business Rules", items: spec.businessRules },
      { title: "Validation Rules", items: spec.validationRules },
      { title: "Error States", items: spec.errorStates },
      { title: "Frontend Expectations", items: spec.frontendExpectations },
      { title: "Backend Expectations", items: spec.backendExpectations },
      { title: "Suggested Files to Change", items: spec.suggestedFiles },
      { title: "Suggested Tests", items: spec.suggestedTests },
      { title: "Open Questions", items: spec.openQuestions },
      { title: "Definition of Done", items: spec.definitionOfDone }
    ];
  }, [spec]);

  if (!spec) {
    return (
      <Card id="shared-spec">
        <CardHeader>
          <h3 className="text-lg font-semibold text-text">Shared specification</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">Generate a shared spec to create the agreement between business and development.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5" id="shared-spec">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-title">Shared Agreement</p>
              <h3 className="mt-2 text-xl font-semibold text-text">{spec.featureName}</h3>
            </div>
            <Badge variant={spec.approvalStatus === "approved" ? "success" : spec.approvalStatus === "needs-clarification" ? "warning" : "neutral"}>
              {spec.approvalStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <ExportMenu
              onMarkdown={async () => {
                await copyToClipboard(exportSpecAsMarkdown(spec));
                pushToast({ title: "Markdown copied", description: "The shared spec markdown is ready to paste.", variant: "success" });
              }}
              onPdf={() => {
                const blob = exportSpecAsPdf(spec);
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              onGitHub={async () => {
                await copyToClipboard(exportSpecAsGitHubIssue(spec));
                pushToast({ title: "Issue format copied", description: "Ready for GitHub issue creation.", variant: "success" });
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await copyToClipboard(exportDeveloperChecklist(spec));
                pushToast({ title: "Checklist copied", description: "Developer checklist copied for handoff.", variant: "success" });
              }}
            >
              Turn into developer checklist
            </Button>
            {lastClarification?.audioUrl ? <audio controls className="min-w-[260px]" src={resolveVoiceAssetUrl(lastClarification.audioUrl)} /> : null}
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="rounded-xl border border-border/70 bg-muted-surface p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <p key={`${section.title}-${item}`} className="text-sm text-text">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onStatusChange("approved")}>
              <CheckCircle2 className="size-4" />
              Mark as Approved
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onStatusChange("needs-clarification")}>
              <ShieldAlert className="size-4" />
              Mark as Needs Clarification
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <VoicePlaybackButton
              cacheKey="developer-checklist-voice"
              label="Play Developer Checklist"
              text={spec.technicalTasks.map((task) => `${task.title}. ${task.description}`).join(" ")}
              quality="fast"
            />
            <VoiceCaptureCard
              title="Voice Comments on Tickets / Specs"
              description="Record clarification, approval, or correction notes and attach them to the shared spec."
              mode="comment"
              workspaceId={workspace.id}
              ticketId={`${workspace.id}:spec`}
              actionLabel="Add Voice Comment"
              createdBy={workspace.lastVoiceCommentBy || "Reviewer"}
              summaryMode="business"
              onCommentCreated={(comment) => addVoiceComment(comment)}
            />
          </div>
        </CardContent>
      </Card>
      <TechnicalTaskList tasks={spec.technicalTasks} />
    </div>
  );
}
