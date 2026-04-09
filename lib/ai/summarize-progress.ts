import { createStructuredResponse } from "@/lib/ai/openai-responses";
import {
  buildSummarizeProgressUserPrompt,
  summarizeProgressSystemPrompt
} from "@/lib/ai/prompts/summarize-progress";
import type {
  SummarizeProgressRequest,
  SummarizeProgressResponse
} from "@/lib/domain/api";
import { isSummarizeProgressResponse } from "@/lib/domain/api";

const summarizeProgressSchema = {
  type: "json_schema" as const,
  name: "bridgeflow_summarize_progress",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "overallStatus",
      "completedItems",
      "inProgressItems",
      "blockedItems",
      "risks",
      "nextSteps",
      "businessFacingSummary",
      "managerFacingSummary"
    ],
    properties: {
      overallStatus: { type: "string" },
      completedItems: {
        type: "array",
        items: { type: "string" }
      },
      inProgressItems: {
        type: "array",
        items: { type: "string" }
      },
      blockedItems: {
        type: "array",
        items: { type: "string" }
      },
      risks: {
        type: "array",
        items: { type: "string" }
      },
      nextSteps: {
        type: "array",
        items: { type: "string" }
      },
      businessFacingSummary: { type: "string" },
      managerFacingSummary: { type: "string" }
    }
  }
};

export async function generateSummarizeProgressResponse(
  input: SummarizeProgressRequest
): Promise<SummarizeProgressResponse> {
  const model = process.env.OPENAI_SUMMARIZE_MODEL ?? "gpt-4.1";

  const result = await createStructuredResponse<SummarizeProgressResponse>({
    model,
    systemPrompt: summarizeProgressSystemPrompt,
    userPrompt: buildSummarizeProgressUserPrompt(input),
    schema: summarizeProgressSchema
  });

  if (!isSummarizeProgressResponse(result)) {
    throw new Error("Model output failed summarize-progress validation.");
  }

  return result;
}
