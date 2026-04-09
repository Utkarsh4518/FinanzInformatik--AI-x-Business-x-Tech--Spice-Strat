import { NextResponse } from "next/server";

import { generateHandoverResponse } from "@/lib/ai/generate-handover";
import type {
  ApiErrorResponse,
  ApiItemResponse,
  GenerateHandoverResponse
} from "@/lib/domain/api";
import { isGenerateHandoverRequest } from "@/lib/domain/api";
import { buildMockGenerateHandoverResponse } from "@/lib/server/mock-generate-handover";

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isGenerateHandoverRequest(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Generate-handover request is missing required fields." },
      { status: 400 }
    );
  }

  let handoverResponse: GenerateHandoverResponse;

  try {
    handoverResponse = await generateHandoverResponse(payload);
  } catch {
    handoverResponse = buildMockGenerateHandoverResponse(payload);
  }

  return NextResponse.json<ApiItemResponse<GenerateHandoverResponse>>({
    data: handoverResponse
  });
}
