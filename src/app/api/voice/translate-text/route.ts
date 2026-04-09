import { NextRequest, NextResponse } from "next/server";
import { voiceTranslationService } from "@/lib/voice/elevenlabs";
import type { VoiceTranslateRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VoiceTranslateRequest;
  const translatedText = await voiceTranslationService.translateText({
    text: body.text,
    sourceLanguage: body.sourceLanguage,
    targetLanguage: body.targetLanguage
  });
  const rewrittenText =
    body.summaryMode === "developer"
      ? await voiceTranslationService.rewriteForDeveloper(translatedText)
      : await voiceTranslationService.rewriteForBusiness(translatedText);

  return NextResponse.json({
    originalText: body.text,
    translatedText,
    rewrittenText
  });
}
