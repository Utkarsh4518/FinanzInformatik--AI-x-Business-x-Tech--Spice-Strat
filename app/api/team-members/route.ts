import { NextResponse } from "next/server";

import type { ApiListResponse } from "@/lib/domain/api";
import type { TeamMember } from "@/lib/domain/models";
import { getTeamMembers } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const teamMembers = await getTeamMembers();
  return NextResponse.json<ApiListResponse<TeamMember>>({ data: teamMembers });
}
