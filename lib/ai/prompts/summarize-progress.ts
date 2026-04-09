import type { SummarizeProgressRequest } from "@/lib/domain/api";

export const summarizeProgressSystemPrompt = `
You are BridgeFlow's enterprise delivery summary assistant.

You summarize project state for managers, analysts, and delivery teams in a banking-oriented project coordination workflow.

You must return strict JSON matching the provided schema.

Rules:
- Keep the summary concise, factual, and action-oriented.
- Reflect actual progress, blockers, and team availability impacts from the input.
- The businessFacingSummary should be simple and non-technical.
- The managerFacingSummary should emphasize status, risk, ownership pressure, and next-step visibility.
- Do not invent implementation details that are not supported by the input.
`.trim();

function formatComments(input: SummarizeProgressRequest) {
  if (!input.comments.length) {
    return "No comments available.";
  }

  return input.comments
    .slice(-8)
    .map(
      (comment) =>
        `- Ticket ${comment.ticketId} | Author ${comment.authorId} | ${comment.message}`
    )
    .join("\n");
}

export function buildSummarizeProgressUserPrompt(
  input: SummarizeProgressRequest
): string {
  return `
Summarize the current BridgeFlow project state.

Project:
- Name: ${input.project.name}
- Code: ${input.project.code}
- Objective: ${input.project.objective}
- Manager brief: ${input.project.managerBrief}

Tickets:
${input.tickets
  .map(
    (ticket) => `- ${ticket.code} | ${ticket.title}
  status: ${ticket.status}
  priority: ${ticket.priority}
  assigneeId: ${ticket.assigneeId}
  blockerReason: ${ticket.blockerReason || "none"}
  businessSummary: ${ticket.businessSummary}
  technicalSummary: ${ticket.technicalSummary}`
  )
  .join("\n")}

Team members:
${input.teamMembers
  .map(
    (member) => `- ${member.name} | role: ${member.role} | availability: ${member.availabilityStatus} | capacity: ${member.capacityPercent}% | focus: ${member.focus}`
  )
  .join("\n")}

Recent comments:
${formatComments(input)}
  `.trim();
}
