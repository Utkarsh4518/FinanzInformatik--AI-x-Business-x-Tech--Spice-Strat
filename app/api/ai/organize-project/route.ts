import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiItemResponse,
  OrganizeProjectResponse
} from "@/lib/domain/api";
import { isOrganizeProjectRequest } from "@/lib/domain/api";
import { generateOrganizeProjectResponse } from "@/lib/ai/organize-project";
import { replaceTickets } from "@/lib/server/bridgeflow-repository";
import {
  buildMockOrganizeProjectResponse,
  buildPersistedTicketsFromOrganizeResponse
} from "@/lib/server/mock-organize-project";

export async function POST(request: Request) {
  const payload = await request.json();

  if (
    !isOrganizeProjectRequest(payload) ||
    !payload.projectId.trim() ||
    !payload.rawInput.trim()
  ) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Organize request is missing required fields." },
      { status: 400 }
    );
  }

  let organizeResponse: OrganizeProjectResponse;

  try {
    organizeResponse = await generateOrganizeProjectResponse(payload);
  } catch {
    organizeResponse = buildMockOrganizeProjectResponse(payload);
  }

  const nextTickets = buildPersistedTicketsFromOrganizeResponse(
    payload,
    organizeResponse
  );

  await replaceTickets(nextTickets);

  return NextResponse.json<ApiItemResponse<OrganizeProjectResponse>>({
    data: organizeResponse
  });
}
