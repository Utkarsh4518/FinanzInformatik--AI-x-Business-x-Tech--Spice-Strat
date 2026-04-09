import { createStructuredResponse } from "@/lib/ai/openai-responses";
import {
  buildRepoImpactUserPrompt,
  repoImpactSystemPrompt
} from "@/lib/ai/prompts/repo-impact";
import type { RepoImpactResponse, RepoImpactRequest } from "@/lib/domain/api";
import { isRepoImpactResponse } from "@/lib/domain/api";

const repoImpactSchema = {
  type: "json_schema" as const,
  name: "bridgeflow_repo_impact",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["relevantFiles", "overallImpactSummary"],
    properties: {
      overallImpactSummary: { type: "string" },
      relevantFiles: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["path", "reason", "confidenceScore"],
          properties: {
            path: { type: "string" },
            reason: { type: "string" },
            confidenceScore: { type: "number" }
          }
        }
      }
    }
  }
};

export async function generateRepoImpactResponse(
  input: RepoImpactRequest
): Promise<RepoImpactResponse> {
  const model = process.env.OPENAI_REPO_IMPACT_MODEL ?? "gpt-4.1";

  const result = await createStructuredResponse<RepoImpactResponse>({
    model,
    systemPrompt: repoImpactSystemPrompt,
    userPrompt: buildRepoImpactUserPrompt(input),
    schema: repoImpactSchema
  });

  if (!isRepoImpactResponse(result)) {
    throw new Error("Model output failed repo-impact validation.");
  }

  return result;
}
