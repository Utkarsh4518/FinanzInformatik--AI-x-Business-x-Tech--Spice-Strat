import { NextResponse } from "next/server";

import { generateRepoImpactResponse } from "@/lib/ai/repo-impact";
import type {
  ApiErrorResponse,
  ApiItemResponse,
  RepoImpactResponse
} from "@/lib/domain/api";
import { isRepoImpactRequest } from "@/lib/domain/api";
import { buildMockRepoImpactResponse } from "@/lib/server/mock-repo-impact";

export async function POST(request: Request) {
  const payload = await request.json();

  if (!isRepoImpactRequest(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Repo-impact request is missing required fields." },
      { status: 400 }
    );
  }

  let repoImpactResponse: RepoImpactResponse;

  try {
    repoImpactResponse = await generateRepoImpactResponse(payload);
  } catch {
    repoImpactResponse = buildMockRepoImpactResponse(payload);
  }

  return NextResponse.json<ApiItemResponse<RepoImpactResponse>>({
    data: repoImpactResponse
  });
}
