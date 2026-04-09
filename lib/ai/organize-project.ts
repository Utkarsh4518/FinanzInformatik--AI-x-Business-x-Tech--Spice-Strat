import type {
  OrganizeProjectRequest,
  OrganizeProjectResponse
} from "@/lib/domain/api";
import { isOrganizeProjectResponse } from "@/lib/domain/api";
import { createStructuredResponse } from "@/lib/ai/openai-responses";
import {
  buildOrganizeProjectUserPrompt,
  organizeProjectSystemPrompt
} from "@/lib/ai/prompts/organize-project";

const organizeProjectSchema = {
  type: "json_schema" as const,
  name: "bridgeflow_organize_project",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "projectSummary",
      "clarifiedScope",
      "openQuestions",
      "risks",
      "tickets",
      "assignmentSuggestions"
    ],
    properties: {
      projectSummary: { type: "string" },
      clarifiedScope: {
        type: "array",
        items: { type: "string" }
      },
      openQuestions: {
        type: "array",
        items: { type: "string" }
      },
      risks: {
        type: "array",
        items: { type: "string" }
      },
      assignmentSuggestions: {
        type: "array",
        items: { type: "string" }
      },
      tickets: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "title",
            "description",
            "businessSummary",
            "technicalSummary",
            "type",
            "priority",
            "suggestedAssigneeName",
            "dependencies",
            "estimateHours"
          ],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            businessSummary: { type: "string" },
            technicalSummary: { type: "string" },
            type: {
              type: "string",
              enum: ["feature", "task", "bug", "research"]
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "critical"]
            },
            suggestedAssigneeName: { type: "string" },
            dependencies: {
              type: "array",
              items: { type: "string" }
            },
            estimateHours: { type: "number" }
          }
        }
      }
    }
  }
};

export async function generateOrganizeProjectResponse(
  input: OrganizeProjectRequest
): Promise<OrganizeProjectResponse> {
  const model = process.env.OPENAI_ORGANIZE_MODEL ?? "gpt-4.1";

  const result = await createStructuredResponse<OrganizeProjectResponse>({
    model,
    systemPrompt: organizeProjectSystemPrompt,
    userPrompt: buildOrganizeProjectUserPrompt(input),
    schema: organizeProjectSchema
  });

  if (!isOrganizeProjectResponse(result)) {
    throw new Error("Model output failed organize-project validation.");
  }

  return result;
}
