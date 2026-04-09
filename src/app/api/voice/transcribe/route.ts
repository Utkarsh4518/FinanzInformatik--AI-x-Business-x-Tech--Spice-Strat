import { NextRequest, NextResponse } from "next/server";
import { addActivityEvent, addVoiceSession, setAnalysis, setSpec } from "@/lib/db/mock-store";
import { buildSharedSpecFromAnalysis, generateRequirementAnalysis } from "@/lib/analysis";
import { createId } from "@/lib/utils";
import { elevenLabsService, voiceTranslationService } from "@/lib/voice/elevenlabs";
import type { VoiceSession } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const workspaceId = String(formData.get("workspaceId") || "workspace_demo_loan_term");
  const sourceLanguage = String(formData.get("sourceLanguage") || process.env.DEFAULT_SOURCE_LANGUAGE || "en");
  const targetLanguage = String(formData.get("targetLanguage") || process.env.DEFAULT_TARGET_LANGUAGE || "de");
  const mode = String(formData.get("mode") || "requirement");
  const roleMode = String(formData.get("roleMode") || "business") as "business" | "developer" | "reviewer";
  const wordingMode = String(formData.get("wordingMode") || "simple") as "simple" | "technical";
  const metadataRaw = String(formData.get("metadata") || "{}");
  const metadata = JSON.parse(metadataRaw) as Record<string, string>;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const transcription = await elevenLabsService.transcribeAudio({
    fileBuffer: buffer,
    filename: file.name || `${createId("audio")}.webm`,
    mimeType: file.type,
    sourceLanguage
  });

  transcription.translatedTranscript = targetLanguage && targetLanguage !== transcription.detectedLanguage
    ? await voiceTranslationService.translateText({
        text: transcription.transcript,
        sourceLanguage: transcription.detectedLanguage,
        targetLanguage
      })
    : transcription.transcript;

  addActivityEvent(workspaceId, "voice", `Voice transcription completed for ${mode}.`, "complete");

  if (mode === "requirement") {
    const analysis = await generateRequirementAnalysis(transcription.transcript, metadata, roleMode, wordingMode);
    const spec = buildSharedSpecFromAnalysis(workspaceId, "Voice-captured requirement", analysis, metadata);
    setAnalysis(workspaceId, analysis);
    setSpec(workspaceId, spec);
    return NextResponse.json({
      transcription,
      analysis,
      spec
    });
  }

  if (mode === "session") {
    const summary = await voiceTranslationService.summarizeSession(transcription.transcript);
    const session: VoiceSession = {
      id: createId("session"),
      workspaceId,
      transcript: transcription.transcript,
      translatedTranscript: transcription.translatedTranscript,
      summary,
      speakers: transcription.speakers,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString()
    };
    addVoiceSession(session);
    addActivityEvent(workspaceId, "voice", "Live discussion session saved.", "complete");
    return NextResponse.json({
      transcription,
      voiceSession: session
    });
  }

  return NextResponse.json({
    transcription
  });
}
