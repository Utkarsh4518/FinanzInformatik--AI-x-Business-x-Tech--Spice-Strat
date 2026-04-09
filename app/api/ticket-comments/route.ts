import { NextResponse } from "next/server";

import type { ApiListResponse } from "@/lib/domain/api";
import type { TicketComment } from "@/lib/domain/models";
import { getTicketComments } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ticketComments = await getTicketComments();
  return NextResponse.json<ApiListResponse<TicketComment>>({
    data: ticketComments
  });
}
