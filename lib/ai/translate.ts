import type { TranslateRequest, TranslateResponse } from "@/lib/domain/api";
import { isTranslateResponse } from "@/lib/domain/api";
import { createStructuredResponse } from "@/lib/ai/openai-responses";
import {
  buildTranslateUserPrompt,
  translateSystemPrompt
} from "@/lib/ai/prompts/translate";

const translateSchema = {
  type: "json_schema" as const,
  name: "bridgeflow_translate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "sourceLanguageDetected",
      "translatedText",
      "conciseExplanation"
    ],
    properties: {
      sourceLanguageDetected: { type: "string" },
      translatedText: { type: "string" },
      conciseExplanation: { type: "string" }
    }
  }
};

export async function generateTranslateResponse(
  input: TranslateRequest
): Promise<TranslateResponse> {
  const model = process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-4.1";

  const result = await createStructuredResponse<TranslateResponse>({
    model,
    systemPrompt: translateSystemPrompt,
    userPrompt: buildTranslateUserPrompt(input),
    schema: translateSchema
  });

  if (!isTranslateResponse(result)) {
    throw new Error("Model output failed translate validation.");
  }

  return result;
}
