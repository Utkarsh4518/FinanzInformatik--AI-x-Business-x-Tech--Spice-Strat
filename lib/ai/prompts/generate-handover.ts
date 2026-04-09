import type { GenerateHandoverRequest } from "@/lib/domain/api";

function formatComments(input: GenerateHandoverRequest) {
  if (!input.ticketComments.length) {
    return "No ticket comments available.";
  }

  return input.ticketComments
    .map(
      (comment) =>
        `- ${comment.createdAt} | ${comment.authorId} | ${comment.message}`
    )
    .join("\n");
}

function formatTeam(input: GenerateHandoverRequest) {
  return input.teamMembers
    .map(
      (member) =>
        `- ${member.name} | role: ${member.role} | availability: ${member.availabilityStatus} | capacity: ${member.capacityPercent}% | focus: ${member.focus}`
    )
    .join("\n");
}

export const generateHandoverSystemPrompt = `
You are BridgeFlow's enterprise handover assistant.

You help managers, analysts, and developers keep delivery moving when work must be reassigned.

You must return strict JSON matching the provided schema.

Rules:
- Keep the output concise, factual, and immediately usable.
- Summarize what is already done, what remains, and what is still uncertain.
- Suggest a practical next owner based on availability, role fit, and visible capacity.
- The businessFacingSummary must be non-technical and continuity-focused.
- Avoid inventing work that is not supported by the provided ticket, comments, and project context.
`.trim();

export function buildGenerateHandoverUserPrompt(
  input: GenerateHandoverRequest
): string {
  return `
Generate a handover for the following BridgeFlow ticket.

Project summary:
${input.projectSummary}

Current role view:
${input.currentRoleView ?? "manager"}

Ticket:
- Code: ${input.ticket.code}
- Title: ${input.ticket.title}
- Description: ${input.ticket.description}
- Business summary: ${input.ticket.businessSummary}
- Technical summary: ${input.ticket.technicalSummary}
- Status: ${input.ticket.status}
- Priority: ${input.ticket.priority}
- Dependencies: ${input.ticket.dependencies.join(", ") || "none"}
- Blocker: ${input.relatedBlockerContext || input.ticket.blockerReason || "none"}

Current assignee:
${input.currentAssignee ? `${input.currentAssignee.name} (${input.currentAssignee.role})` : "unknown"}

Requested next assignee:
${input.nextAssignee ? `${input.nextAssignee.name} (${input.nextAssignee.role})` : "not specified"}

Team context:
${formatTeam(input)}

Ticket comments:
${formatComments(input)}
  `.trim();
}
