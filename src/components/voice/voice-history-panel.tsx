"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { resolveVoiceAssetUrl } from "@/lib/voice/asset-url";

export function VoiceHistoryPanel() {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const voiceComments = useWorkspaceStore((state) => state.voiceComments);
  const voiceSessions = useWorkspaceStore((state) => state.voiceSessions);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title">Voice History</p>
            <h3 className="mt-2 text-lg font-semibold text-text">Comments and sessions</h3>
          </div>
          <Badge variant={workspace.correctionCount ? "warning" : "primary"}>{workspace.correctionCount ?? 0} corrections</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {voiceComments.length === 0 && voiceSessions.length === 0 ? (
          <p className="text-sm text-text-muted">No voice history yet. Record a voice requirement, comment, or live session to populate this panel.</p>
        ) : null}
        {voiceComments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-border/70 bg-muted-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant={comment.correctionRequested ? "warning" : "primary"}>{comment.createdBy}</Badge>
              <span className="text-xs uppercase tracking-wide text-text-muted">{format(new Date(comment.createdAt), "dd MMM HH:mm")}</span>
            </div>
            <p className="text-sm text-text">{comment.summary}</p>
            <p className="mt-2 text-sm text-text-muted">{comment.transcript}</p>
            {comment.translatedTranscript && comment.translatedTranscript !== comment.transcript ? (
              <div className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                {comment.translatedTranscript}
              </div>
            ) : null}
            {comment.audioUrl ? <audio controls className="mt-3 w-full" src={resolveVoiceAssetUrl(comment.audioUrl)} /> : null}
          </div>
        ))}
        {voiceSessions.map((session) => (
          <div key={session.id} className="rounded-xl border border-border/70 bg-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="success">Live Discussion</Badge>
              <span className="text-xs uppercase tracking-wide text-text-muted">{format(new Date(session.endedAt), "dd MMM HH:mm")}</span>
            </div>
            <p className="text-sm font-medium text-text">Decisions: {session.summary.decisions.join(" | ")}</p>
            <p className="mt-2 text-sm text-text-muted">{session.transcript}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
