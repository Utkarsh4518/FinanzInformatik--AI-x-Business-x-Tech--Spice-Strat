import type { RepoImpactRequest } from "@/lib/domain/api";

function formatTicketOrRequirement(input: RepoImpactRequest) {
  if (input.selectedTicket) {
    return `Selected ticket:
- Code: ${input.selectedTicket.code}
- Title: ${input.selectedTicket.title}
- Description: ${input.selectedTicket.description}
- Business summary: ${input.selectedTicket.businessSummary}
- Technical summary: ${input.selectedTicket.technicalSummary}
- Status: ${input.selectedTicket.status}
- Priority: ${input.selectedTicket.priority}
- Dependencies: ${input.selectedTicket.dependencies.join(", ") || "none"}
- Blocker: ${input.selectedTicket.blockerReason || "none"}`;
  }

  return `Requirement:
${input.requirement ?? ""}`;
}

function formatRepoFileSummaries(input: RepoImpactRequest) {
  return input.repoFileSummaries
    .map(
      (file) => `- ${file.path}
  area: ${file.area}
  importanceScore: ${file.importanceScore}
  summary: ${file.summary}
  excerpt: ${file.excerpt ?? "none"}
  tags: ${(file.tags ?? []).join(", ") || "none"}`
    )
    .join("\n");
}

export const repoImpactSystemPrompt = `
You are BridgeFlow's repo impact assistant.

You help managers, analysts, and developers estimate which local files are likely affected by a selected ticket or requirement.

You must return strict JSON matching the provided schema.

Rules:
- Use only the curated repo file summaries provided in the input.
- Prefer the most relevant files rather than returning every file.
- Explain relevance clearly and concisely.
- Confidence scores should be numeric from 0 to 1.
- Tailor the overallImpactSummary to the requested role view when present.
`.trim();

export function buildRepoImpactUserPrompt(input: RepoImpactRequest): string {
  return `
Analyze likely repo impact for the following BridgeFlow work item.

Current role view:
${input.currentRoleView ?? "developer"}

${formatTicketOrRequirement(input)}

Curated repo file summaries:
${formatRepoFileSummaries(input)}
  `.trim();
}
