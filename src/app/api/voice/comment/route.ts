import { NextRequest, NextResponse } from "next/server";
import { addActivityEvent, addVoiceComment } from "@/lib/db/mock-store";
import { createId } from "@/lib/utils";
import { voiceTranslationService } from "@/lib/voice/elevenlabs";
import type { VoiceCommentRequest } from "@/lib/types/api";
import type { VoiceComment } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VoiceCommentRequest;
  const summary =
    body.summaryMode === "developer"
      ? await voiceTranslationService.rewriteForDeveloper(body.transcript)
      : await voiceTranslationService.rewriteForBusiness(body.transcript);

  const comment: VoiceComment = {
    id: createId("voice"),
    ticketId: body.ticketId,
    workspaceId: body.workspaceId,
    audioUrl: body.audioUrl,
    transcript: body.transcript,
    translatedTranscript: body.translatedTranscript,
    sourceLanguage: body.sourceLanguage,
    targetLanguage: body.targetLanguage,
    summary,
    summaryMode: body.summaryMode ?? "business",
    createdBy: body.createdBy,
    createdAt: new Date().toISOString(),
    correctionRequested: body.correctionRequested,
    correctionReason: body.correctionReason,
    correctionCount: body.correctionRequested ? 1 : 0
  };

  addVoiceComment(comment);
  addActivityEvent(body.workspaceId, "voice", `Voice comment added to ${body.ticketId}.`, "complete");

  return NextResponse.json({ comment });
}
