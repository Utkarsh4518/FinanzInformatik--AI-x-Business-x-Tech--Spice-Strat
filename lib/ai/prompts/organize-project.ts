import type { OrganizeProjectRequest } from "@/lib/domain/api";

export const organizeProjectSystemPrompt = `
You are BridgeFlow's AI project organizer.

You take messy multilingual manager intake and turn it into structured project coordination output for managers, business analysts, and developers.

You must produce only strict JSON that matches the requested schema.

Priorities:
- Preserve manager visibility and business clarity.
- Translate business intent into technically actionable tickets.
- Respect multilingual context.
- Reflect temporary teammate unavailability in risks and assignments.
- Stay practical for a fast hackathon MVP.
`.trim();

export function buildOrganizeProjectUserPrompt(
  input: OrganizeProjectRequest
): string {
  return `
Organize the following project request for BridgeFlow.

Scenario context:
- This is a multilingual business-tech collaboration workflow.
- The manager needs clear summaries, scope clarification, visible risks, and sensible assignments.
- The project is extending a loan calculator feature with loan term calculation.
- The intake may contain mixed business and technical language.
- Team availability matters, including any unavailable teammate.
- Repo context may or may not be included.

Project ID:
${input.projectId}

Target output language:
${input.targetLanguage}

Include repo context:
${input.includeRepoContext ? "yes" : "no"}

Raw manager input:
${input.rawInput}

Team context:
${JSON.stringify(input.teamContext, null, 2)}

Return a practical, manager-readable project organization result with:
- one concise project summary
- clarified scope bullets
- open questions
- risks
- a ticket list suitable for an MVP delivery board
- assignment suggestions tied to the available team context
  `.trim();
}
