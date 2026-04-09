import { NextRequest, NextResponse } from "next/server";
import { getVoiceComments } from "@/lib/db/mock-store";

export async function GET(_request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await context.params;
  return NextResponse.json({
    ticketId,
    comments: getVoiceComments(ticketId)
  });
}
