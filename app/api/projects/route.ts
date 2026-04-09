import { NextResponse } from "next/server";

import type { ApiListResponse } from "@/lib/domain/api";
import type { Project } from "@/lib/domain/models";
import { getProjects } from "@/lib/server/bridgeflow-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json<ApiListResponse<Project>>({ data: projects });
}
