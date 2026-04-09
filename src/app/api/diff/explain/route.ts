import { NextRequest } from "next/server";
import { generateDiffExplanation } from "@/lib/analysis";
import { createLiveEventStream } from "@/lib/streaming";
import { addActivityEvent, setDiffExplanation } from "@/lib/db/mock-store";
import type { DiffExplainRequest } from "@/lib/types/api";
import type { DiffExplanation } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as DiffExplainRequest;
  const stream = createLiveEventStream<DiffExplanation>(async (send) => {
    const source = body.rawDiff ?? body.prUrl ?? body.commitRange ?? "";
    addActivityEvent(body.workspaceId, "diff", "PR explanation started.", "started");
    await send({ type: "diff", stage: "queued", message: "Diff received for explanation." });
    await send({ type: "diff", stage: "started", message: "Parsing changed files and grouping code evidence.", progress: 35 });
    const explanation = await generateDiffExplanation(source, body.roleMode);
    setDiffExplanation(body.workspaceId, explanation);
    await send({ type: "diff", stage: "progress", message: "Translating technical changes into business language.", progress: 70 });
    addActivityEvent(body.workspaceId, "diff", "PR explanation completed.", "complete");
    await send({ type: "diff", stage: "partial", message: "Preparing release-note and demo-script outputs.", progress: 90 });
    await send({ type: "diff", stage: "complete", message: "Diff explanation completed.", progress: 100, payload: explanation });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
