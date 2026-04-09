"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, Mic, PauseCircle, PlayCircle, StopCircle, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VoicePlaybackButton } from "@/components/voice/voice-playback-button";
import { useUIStore } from "@/lib/state/ui-store";
import type {
  RequirementAnalysis,
  SharedSpec,
  VoiceComment,
  VoiceSession,
  VoiceTranscription
} from "@/lib/types/domain";

type VoiceCaptureMode = "requirement" | "comment" | "session";

export function VoiceCaptureCard({
  title,
  description,
  mode,
  workspaceId,
  ticketId,
  roleMode = "business",
  wordingMode = "simple",
  metadata,
  createdBy = "Current user",
  summaryMode = "business",
  correctionRequested = false,
  correctionReason = "",
  actionLabel,
  onRequirementProcessed,
  onCommentCreated,
  onSessionCreated
}: {
  title: string;
  description: string;
  mode: VoiceCaptureMode;
  workspaceId: string;
  ticketId?: string;
  roleMode?: "business" | "developer" | "reviewer";
  wordingMode?: "simple" | "technical";
  metadata?: Record<string, string | undefined>;
  createdBy?: string;
  summaryMode?: "business" | "developer";
  correctionRequested?: boolean;
  correctionReason?: string;
  actionLabel: string;
  onRequirementProcessed?: (payload: { transcription: VoiceTranscription; analysis?: RequirementAnalysis; spec?: SharedSpec }) => void;
  onCommentCreated?: (comment: VoiceComment) => void;
  onSessionCreated?: (session: VoiceSession) => void;
}) {
  const pushToast = useUIStore((state) => state.pushToast);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState(process.env.NEXT_PUBLIC_DEFAULT_SOURCE_LANGUAGE || "en");
  const [targetLanguage, setTargetLanguage] = useState(process.env.NEXT_PUBLIC_DEFAULT_TARGET_LANGUAGE || "de");

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const availableLanguages = useMemo(
    () => [
      { label: "English", value: "en" },
      { label: "German", value: "de" },
      { label: "French", value: "fr" },
      { label: "Spanish", value: "es" }
    ],
    []
  );

  const transcribeMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) {
        throw new Error("Record audio before submitting.");
      }

      const formData = new FormData();
      formData.append("file", audioBlob, `${mode}-${Date.now()}.webm`);
      formData.append("workspaceId", workspaceId);
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("mode", mode);
      formData.append("roleMode", roleMode);
      formData.append("wordingMode", wordingMode);
      formData.append("metadata", JSON.stringify(metadata ?? {}));

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData
      });

      return (await response.json()) as {
        transcription: VoiceTranscription;
        analysis?: RequirementAnalysis;
        spec?: SharedSpec;
        voiceSession?: VoiceSession;
      };
    },
    onSuccess: async (payload) => {
      setTranscription(payload.transcription);
      pushToast({ title: `${actionLabel} complete`, description: "Voice audio was transcribed successfully.", variant: "success" });

      if (mode === "requirement") {
        onRequirementProcessed?.(payload);
      }

      if (mode === "session" && payload.voiceSession) {
        onSessionCreated?.(payload.voiceSession);
      }

      if (mode === "comment" && ticketId) {
        const response = await fetch("/api/voice/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
            workspaceId,
            audioUrl: payload.transcription.audioUrl,
            transcript: payload.transcription.transcript,
            translatedTranscript: payload.transcription.translatedTranscript,
            sourceLanguage,
            targetLanguage,
            createdBy,
            summaryMode,
            correctionRequested,
            correctionReason
          })
        });
        const data = (await response.json()) as { comment: VoiceComment };
        onCommentCreated?.(data.comment);
      }
    },
    onError: (error) => {
      pushToast({ title: `${actionLabel} failed`, description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const translateMutation = useMutation({
    mutationFn: async () => {
      if (!transcription?.transcript) {
        throw new Error("Transcribe audio before translating.");
      }

      const response = await fetch("/api/voice/translate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcription.transcript,
          sourceLanguage,
          targetLanguage,
          summaryMode
        })
      });
      return (await response.json()) as { translatedText: string };
    },
    onSuccess: (payload) => {
      setTranscription((current) => (current ? { ...current, translatedTranscript: payload.translatedText } : current));
      pushToast({ title: "Translation complete", description: "Translated transcript updated.", variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Translation failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  async function transcribeChunk(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, `chunk-${Date.now()}.webm`);
    formData.append("workspaceId", workspaceId);
    formData.append("sourceLanguage", sourceLanguage);
    formData.append("targetLanguage", targetLanguage);
    formData.append("mode", "session-chunk");

    const response = await fetch("/api/voice/transcribe", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as { transcription: VoiceTranscription };
    if (payload.transcription?.transcript) {
      setLiveTranscript((current) => `${current}${current ? " " : ""}${payload.transcription.transcript}`.trim());
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    setLiveTranscript("");
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        if (mode === "session") {
          void transcribeChunk(event.data);
        }
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextUrl;
      });
      stream.getTracks().forEach((track) => track.stop());
    };
    if (mode === "session") {
      recorder.start(4000);
    } else {
      recorder.start();
    }
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Voice Collaboration</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{title}</h3>
          <p className="mt-2 text-sm text-text-muted">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={sourceLanguage} onChange={setSourceLanguage} options={availableLanguages} />
          <Select value={targetLanguage} onChange={setTargetLanguage} options={availableLanguages} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => startRecording()} disabled={isRecording}>
            <Mic className="size-4" />
            {mode === "requirement" ? "Record Requirement" : mode === "comment" ? "Record Voice Comment" : "Start Live Discussion"}
          </Button>
          <Button variant="secondary" onClick={stopRecording} disabled={!isRecording}>
            <StopCircle className="size-4" />
            Stop
          </Button>
          <Button variant="secondary" onClick={() => transcribeMutation.mutate()} disabled={!audioBlob || transcribeMutation.isPending}>
            {transcribeMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Languages className="size-4" />}
            {actionLabel}
          </Button>
          <Button variant="secondary" onClick={() => translateMutation.mutate()} disabled={!transcription?.transcript || translateMutation.isPending}>
            <Languages className="size-4" />
            {mode === "comment" ? "Translate Comment" : "Translate"}
          </Button>
        </div>
        {audioUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <PlayCircle className="size-4" />
              Replay recording
            </div>
            <audio controls className="w-full" src={audioUrl} />
          </div>
        ) : null}
        {isRecording ? (
          <div className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
            <PauseCircle className="mr-2 inline size-4 text-primary" />
            Recording in progress. Stop when you want to upload and transcribe.
          </div>
        ) : null}
        {mode === "session" && liveTranscript ? (
          <div className="rounded-xl border border-border/70 bg-surface p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Live Transcript Streaming</p>
            <p className="text-sm text-text">{liveTranscript}</p>
          </div>
        ) : null}
        {transcription ? (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Original Transcript</p>
              <Textarea readOnly value={transcription.transcript} className="min-h-[100px]" />
            </div>
            <VoicePlaybackButton
              cacheKey={`${workspaceId}-${mode}-original-voice`}
              label="Play Original Transcript"
              text={transcription.transcript}
              quality="fast"
            />
            {transcription.translatedTranscript ? (
              <>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Translated Transcript</p>
                  <Textarea readOnly value={transcription.translatedTranscript} className="min-h-[100px]" />
                </div>
                <VoicePlaybackButton
                  cacheKey={`${workspaceId}-${mode}-translated-voice`}
                  label="Play Translated Audio"
                  text={transcription.translatedTranscript}
                  quality="high"
                />
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
