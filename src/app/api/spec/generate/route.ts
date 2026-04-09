import { NextRequest, NextResponse } from "next/server";
import { buildSharedSpecFromAnalysis } from "@/lib/analysis";
import { addActivityEvent, setSpec } from "@/lib/db/mock-store";
import type { GenerateSpecRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateSpecRequest;
  const spec = buildSharedSpecFromAnalysis(body.workspaceId, body.title, body.analysis, body.metadata);
  setSpec(body.workspaceId, spec);
  addActivityEvent(body.workspaceId, "spec", "Shared specification regenerated and persisted.", "complete");
  return NextResponse.json({ spec });
}
