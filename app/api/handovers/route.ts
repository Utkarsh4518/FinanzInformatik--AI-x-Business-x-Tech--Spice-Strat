import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiItemResponse,
  ApiListResponse,
  CreateHandoverRequest
} from "@/lib/domain/api";
import { isCreateHandoverRequest } from "@/lib/domain/api";
import type { Handover } from "@/lib/domain/models";
import { createHandover, getHandovers } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const handovers = await getHandovers();
  return NextResponse.json<ApiListResponse<Handover>>({ data: handovers });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateHandoverRequest;

  if (!isCreateHandoverRequest(payload) || !payload.summary.trim()) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Handover payload is missing required fields." },
      { status: 400 }
    );
  }

  const handover = await createHandover(payload);

  if (!handover) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Handover could not be saved." },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiItemResponse<Handover>>({ data: handover });
}
