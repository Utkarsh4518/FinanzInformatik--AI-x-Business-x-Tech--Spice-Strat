import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiItemResponse,
  JiraImportRequest,
  JiraImportResponse
} from "@/lib/domain/api";
import { isJiraImportRequest } from "@/lib/domain/api";
import { importJiraIssues } from "@/lib/server/jira/import-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as JiraImportRequest;

    if (!isJiraImportRequest(payload)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid Jira import payload." },
        { status: 400 }
      );
    }

    const imported = await importJiraIssues(payload);

    return NextResponse.json<ApiItemResponse<JiraImportResponse>>({
      data: imported
    });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          error instanceof Error
            ? error.message
            : "Jira issues could not be imported."
      },
      { status: 503 }
    );
  }
}
