import { NextResponse } from "next/server";

import type { ApiErrorResponse, ApiListResponse, JiraImportRequest, JiraIssuePreview } from "@/lib/domain/api";
import { getJiraIssuePreviews } from "@/lib/server/jira/import-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload: JiraImportRequest = {
      projectKey: searchParams.get("projectKey") ?? undefined,
      jql: searchParams.get("jql") ?? undefined,
      maxResults: searchParams.get("maxResults")
        ? Number(searchParams.get("maxResults"))
        : undefined
    };

    const issues = await getJiraIssuePreviews(payload);

    return NextResponse.json<ApiListResponse<JiraIssuePreview>>({ data: issues });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          error instanceof Error
            ? error.message
            : "Jira issues could not be fetched."
      },
      { status: 503 }
    );
  }
}
