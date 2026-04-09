import { NextResponse } from "next/server";

import type { ApiErrorResponse, ApiItemResponse } from "@/lib/domain/api";
import { isTicketUpdateInput } from "@/lib/domain/api";
import type { Ticket } from "@/lib/domain/models";
import { updateTicket } from "@/lib/server/bridgeflow-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const payload = await request.json();

  if (!isTicketUpdateInput(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid ticket update payload." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const updatedTicket = await updateTicket(id, payload);

  if (!updatedTicket) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Ticket could not be updated." },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiItemResponse<Ticket>>({ data: updatedTicket });
}
