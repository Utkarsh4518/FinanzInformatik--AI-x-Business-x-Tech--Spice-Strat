import { NextResponse } from "next/server";

import type { ApiListResponse } from "@/lib/domain/api";
import type { RepoFileSummary } from "@/lib/domain/models";
import { getRepoFileSummaries } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const repoFileSummaries = await getRepoFileSummaries();
  return NextResponse.json<ApiListResponse<RepoFileSummary>>({
    data: repoFileSummaries
  });
}
