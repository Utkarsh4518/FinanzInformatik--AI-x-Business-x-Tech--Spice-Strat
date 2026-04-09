import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { addActivityEvent } from "@/lib/db/mock-store";
import { elevenLabsService } from "@/lib/voice/elevenlabs";
import type { TestConnectionRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TestConnectionRequest;
  const provider = body.provider.toLowerCase();
  const result =
    provider === "ai"
      ? await getAIProvider().testConnection()
      : provider === "elevenlabs"
        ? await (async () => {
            if (!process.env.ELEVENLABS_API_KEY) {
              return {
                provider: body.provider,
                status: "warning" as const,
                message: "ElevenLabs is not configured."
              };
            }

            const playback = await elevenLabsService.synthesizeSpeech({
              text: "SpecBridge voice connection test.",
              quality: "fast"
            });
            return {
              provider: body.provider,
              status: "success" as const,
              message: playback.audioUrl ? "ElevenLabs voice generation is available." : "ElevenLabs responded, but no local audio file was generated."
            };
          })()
        : {
            provider: body.provider,
            status: "warning" as const,
            message: `${body.provider} is not configured in this demo environment.`
          };

  addActivityEvent("workspace_demo_loan_term", "settings", `Connection tested for ${body.provider}.`, "complete");
  return NextResponse.json({ result });
}
