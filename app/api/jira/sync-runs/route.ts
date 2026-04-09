import { NextResponse } from "next/server";

import type { ApiErrorResponse, ApiListResponse } from "@/lib/domain/api";
import type { JiraSyncRun } from "@/lib/domain/models";
import { getJiraSyncRunSummaries } from "@/lib/server/jira/import-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runs = await getJiraSyncRunSummaries();

    return NextResponse.json<ApiListResponse<JiraSyncRun>>({ data: runs });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          error instanceof Error
            ? error.message
            : "Jira sync runs could not be loaded."
      },
      { status: 503 }
    );
  }
}
