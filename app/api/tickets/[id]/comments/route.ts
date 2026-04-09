import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiItemResponse,
  CreateTicketCommentRequest
} from "@/lib/domain/api";
import { isCreateTicketCommentRequest } from "@/lib/domain/api";
import type { TicketComment } from "@/lib/domain/models";
import { createTicketComment } from "@/lib/server/bridgeflow-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const payload = (await request.json()) as CreateTicketCommentRequest;

  if (!isCreateTicketCommentRequest(payload)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Comment payload must include authorId and message." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const comment = await createTicketComment(id, payload);

  if (!comment) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Comment could not be created for this ticket." },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiItemResponse<TicketComment>>({ data: comment });
}
