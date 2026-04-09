import { NextRequest } from "next/server";
import { buildRequirementPrompt } from "@/lib/ai/prompts";
import { createLiveEventStream } from "@/lib/streaming";
import { generateRequirementAnalysis } from "@/lib/analysis";
import { addActivityEvent, setAnalysis } from "@/lib/db/mock-store";
import type { AnalyzeRequirementRequest, StreamingEvent } from "@/lib/types/api";
import type { RequirementAnalysis } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnalyzeRequirementRequest;
  const prompt = buildRequirementPrompt(body.requirementText, body.roleMode, body.wordingMode);

  const stream = createLiveEventStream<RequirementAnalysis>(async (send) => {
    addActivityEvent(body.workspaceId, "analysis", "Requirement analysis queued.", "queued");
    await send({ type: "analysis", stage: "queued", message: "Requirement received and queued for analysis." });
    await send({ type: "analysis", stage: "started", message: "Interpreting business intent and building the AI prompt." });
    addActivityEvent(body.workspaceId, "analysis", `Prompt prepared with ${prompt.length} characters.`, "started");
    await send({ type: "analysis", stage: "progress", message: "Generating business summary, acceptance criteria, and ambiguity questions.", progress: 40 });
    const analysis = await generateRequirementAnalysis(body.requirementText, body.metadata, body.roleMode, body.wordingMode);
    setAnalysis(body.workspaceId, analysis);
    addActivityEvent(body.workspaceId, "analysis", "Requirement analysis completed and persisted.", "complete");
    await send({ type: "analysis", stage: "partial", message: "Converting AI output into shared workspace cards.", progress: 85 });
    await send({ type: "analysis", stage: "complete", message: "Requirement analysis completed.", progress: 100, payload: analysis });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
