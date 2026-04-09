import { NextResponse } from "next/server";

import { generateTranslateResponse } from "@/lib/ai/translate";
import type {
  ApiErrorResponse,
  ApiItemResponse,
  TranslateResponse
} from "@/lib/domain/api";
import { isTranslateRequest } from "@/lib/domain/api";
import { buildMockTranslateResponse } from "@/lib/server/mock-translate";

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isTranslateRequest(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Translate request is missing required fields." },
      { status: 400 }
    );
  }

  let translateResponse: TranslateResponse;

  try {
    translateResponse = await generateTranslateResponse(payload);
  } catch {
    translateResponse = buildMockTranslateResponse(payload);
  }

  return NextResponse.json<ApiItemResponse<TranslateResponse>>({
    data: translateResponse
  });
}
