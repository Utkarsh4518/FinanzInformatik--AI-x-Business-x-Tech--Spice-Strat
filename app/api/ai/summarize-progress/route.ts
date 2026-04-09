import { NextResponse } from "next/server";

import { generateSummarizeProgressResponse } from "@/lib/ai/summarize-progress";
import type {
  ApiErrorResponse,
  ApiItemResponse,
  SummarizeProgressResponse
} from "@/lib/domain/api";
import { isSummarizeProgressRequest } from "@/lib/domain/api";
import { buildMockSummarizeProgressResponse } from "@/lib/server/mock-summarize-progress";

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isSummarizeProgressRequest(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Summarize-progress request is missing required fields." },
      { status: 400 }
    );
  }

  let summarizeResponse: SummarizeProgressResponse;

  try {
    summarizeResponse = await generateSummarizeProgressResponse(payload);
  } catch {
    summarizeResponse = buildMockSummarizeProgressResponse(payload);
  }

  return NextResponse.json<ApiItemResponse<SummarizeProgressResponse>>({
    data: summarizeResponse
  });
}
