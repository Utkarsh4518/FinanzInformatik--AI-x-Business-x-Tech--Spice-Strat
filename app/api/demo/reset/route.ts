import { NextResponse } from "next/server";

import type { ApiItemResponse } from "@/lib/domain/api";
import { resetDemoWorkspace } from "@/lib/server/bridgeflow-repository";

export async function POST() {
  await resetDemoWorkspace();

  return NextResponse.json<ApiItemResponse<{ ok: true }>>({
    data: { ok: true }
  });
}
