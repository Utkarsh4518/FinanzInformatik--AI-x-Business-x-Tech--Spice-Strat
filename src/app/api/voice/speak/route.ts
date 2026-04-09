import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/voice/elevenlabs";
import type { VoiceSpeakRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VoiceSpeakRequest;
  const playback = await elevenLabsService.synthesizeSpeech({
    text: body.text,
    quality: body.quality,
    voiceId: body.voiceId
  });

  return NextResponse.json({ playback });
}
