import { createStructuredResponse } from "@/lib/ai/openai-responses";
import {
  buildGenerateHandoverUserPrompt,
  generateHandoverSystemPrompt
} from "@/lib/ai/prompts/generate-handover";
import type {
  GenerateHandoverRequest,
  GenerateHandoverResponse
} from "@/lib/domain/api";
import { isGenerateHandoverResponse } from "@/lib/domain/api";

const generateHandoverSchema = {
  type: "json_schema" as const,
  name: "bridgeflow_generate_handover",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "completedWork",
      "remainingWork",
      "unresolvedQuestions",
      "suggestedNextSteps",
      "businessFacingSummary",
      "suggestedNextOwner"
    ],
    properties: {
      summary: { type: "string" },
      completedWork: {
        type: "array",
        items: { type: "string" }
      },
      remainingWork: {
        type: "array",
        items: { type: "string" }
      },
      unresolvedQuestions: {
        type: "array",
        items: { type: "string" }
      },
      suggestedNextSteps: {
        type: "array",
        items: { type: "string" }
      },
      businessFacingSummary: { type: "string" },
      suggestedNextOwner: { type: "string" }
    }
  }
};

export async function generateHandoverResponse(
  input: GenerateHandoverRequest
): Promise<GenerateHandoverResponse> {
  const model = process.env.OPENAI_HANDOVER_MODEL ?? "gpt-4.1";

  const result = await createStructuredResponse<GenerateHandoverResponse>({
    model,
    systemPrompt: generateHandoverSystemPrompt,
    userPrompt: buildGenerateHandoverUserPrompt(input),
    schema: generateHandoverSchema
  });

  if (!isGenerateHandoverResponse(result)) {
    throw new Error("Model output failed generate-handover validation.");
  }

  return result;
}
