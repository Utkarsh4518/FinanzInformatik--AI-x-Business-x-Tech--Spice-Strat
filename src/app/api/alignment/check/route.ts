import { NextRequest } from "next/server";
import { generateAlignmentReport } from "@/lib/analysis";
import { createLiveEventStream } from "@/lib/streaming";
import { addActivityEvent, setAlignment } from "@/lib/db/mock-store";
import type { AlignmentCheckRequest } from "@/lib/types/api";
import type { AlignmentReport } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AlignmentCheckRequest;
  const stream = createLiveEventStream<AlignmentReport>(async (send) => {
    addActivityEvent(body.workspaceId, "alignment", "Alignment evaluation started.", "started");
    await send({ type: "alignment", stage: "queued", message: "Requirement and implementation evidence queued for comparison." });
    await send({ type: "alignment", stage: "started", message: "Mapping acceptance criteria to diff and code evidence.", progress: 30 });
    const report = await generateAlignmentReport(body.workspaceId, body.diffText, body.spec);
    setAlignment(body.workspaceId, report);
    await send({ type: "alignment", stage: "progress", message: "Scoring coverage and detecting missing or partial behavior.", progress: 70 });
    addActivityEvent(body.workspaceId, "alignment", "Alignment report completed.", "complete");
    await send({ type: "alignment", stage: "partial", message: "Preparing traceability matrix and follow-up questions.", progress: 90 });
    await send({ type: "alignment", stage: "complete", message: "Alignment report completed.", progress: 100, payload: report });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
