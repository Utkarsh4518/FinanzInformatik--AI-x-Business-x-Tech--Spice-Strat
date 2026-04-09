import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiItemResponse,
  JiraSyncRunDetail
} from "@/lib/domain/api";
import { getJiraSyncRunDetail } from "@/lib/server/jira/import-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await getJiraSyncRunDetail(id);

    if (!detail) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Jira sync run was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiItemResponse<JiraSyncRunDetail>>({
      data: detail
    });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          error instanceof Error
            ? error.message
            : "Jira sync run detail could not be loaded."
      },
      { status: 503 }
    );
  }
}
