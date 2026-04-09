"use client";

import { useMutation } from "@tanstack/react-query";
import { Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/state/ui-store";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import type { VoicePlaybackAsset } from "@/lib/types/domain";
import { resolveVoiceAssetUrl } from "@/lib/voice/asset-url";

export function VoicePlaybackButton({
  cacheKey,
  label,
  text,
  quality = "fast"
}: {
  cacheKey: string;
  label: string;
  text: string;
  quality?: "fast" | "high";
}) {
  const pushToast = useUIStore((state) => state.pushToast);
  const playback = useWorkspaceStore((state) => state.playbackAssets[cacheKey]);
  const setPlaybackAsset = useWorkspaceStore((state) => state.setPlaybackAsset);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, quality })
      });
      return (await response.json()) as { playback: VoicePlaybackAsset };
    },
    onSuccess: ({ playback }) => {
      setPlaybackAsset(cacheKey, playback);
      pushToast({ title: `${label} audio ready`, description: "Playback was generated successfully.", variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: `${label} audio failed`, description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending || !text}>
        {quality === "high" ? <Volume2 className="size-4" /> : <Play className="size-4" />}
        {label}
      </Button>
      {playback?.audioUrl ? <audio controls className="w-full" src={resolveVoiceAssetUrl(playback.audioUrl)} /> : null}
      {playback && !playback.audioUrl ? (
        <div className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text-muted">
          ElevenLabs playback is not configured yet, so only the text payload was generated.
        </div>
      ) : null}
    </div>
  );
}
