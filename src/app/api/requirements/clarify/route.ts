import { NextRequest, NextResponse } from "next/server";
import { detectAmbiguities } from "@/lib/analysis";
import { addActivityEvent } from "@/lib/db/mock-store";
import type { ClarifyRequirementRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ClarifyRequirementRequest;
  const ambiguities = detectAmbiguities(body.requirementText);
  addActivityEvent(body.workspaceId, "analysis", `Clarification endpoint found ${ambiguities.length} ambiguity prompts.`, "complete");

  return NextResponse.json({ ambiguities });
}
