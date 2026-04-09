import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/db/mock-store";

export async function GET(_request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await context.params;
  return NextResponse.json({
    workspaceId,
    events: getActivity(workspaceId)
  });
}
