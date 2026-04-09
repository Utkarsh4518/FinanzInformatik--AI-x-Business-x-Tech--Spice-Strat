import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/voice/elevenlabs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sourceLanguage = String(formData.get("sourceLanguage") || process.env.DEFAULT_SOURCE_LANGUAGE || "en");
  const targetLanguage = String(formData.get("targetLanguage") || process.env.DEFAULT_TARGET_LANGUAGE || "de");

  if (!(file instanceof File)) {
    return NextResponse.json({ status: "error", message: "Audio or video file is required." }, { status: 400 });
  }

  const result = await elevenLabsService.dubMedia({
    fileBuffer: Buffer.from(await file.arrayBuffer()),
    filename: file.name || `${Date.now()}.mp3`,
    sourceLanguage,
    targetLanguage
  });

  return NextResponse.json(result);
}
