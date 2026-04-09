import { NextResponse } from "next/server";

import type { ApiListResponse } from "@/lib/domain/api";
import type { Ticket } from "@/lib/domain/models";
import { getTickets } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const tickets = await getTickets();
  return NextResponse.json<ApiListResponse<Ticket>>({ data: tickets });
}
