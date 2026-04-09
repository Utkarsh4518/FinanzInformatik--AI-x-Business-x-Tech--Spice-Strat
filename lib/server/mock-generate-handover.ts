import type {
  GenerateHandoverRequest,
  GenerateHandoverResponse
} from "@/lib/domain/api";
import type { TeamMember, Ticket, TicketComment } from "@/lib/domain/models";

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim())));
}

function scoreMember(
  member: TeamMember,
  ticket: Ticket,
  currentAssigneeId: string,
  requestedNextAssigneeId?: string
) {
  if (member.id === requestedNextAssigneeId) {
    return 10_000;
  }

  if (member.availabilityStatus === "unavailable") {
    return -10_000;
  }

  let score = member.capacityPercent;

  if (member.id === currentAssigneeId) {
    score -= 250;
  }

  if (member.availabilityStatus === "available") {
    score += 120;
  }

  if (member.availabilityStatus === "busy") {
    score -= 40;
  }

  const searchableText = `${ticket.title} ${ticket.description} ${ticket.technicalSummary} ${ticket.businessSummary}`.toLowerCase();
  const roleMatch =
    (searchableText.includes("backend") && member.role === "backend_engineer") ||
    (searchableText.includes("ui") && member.role === "frontend_engineer") ||
    (searchableText.includes("business") && member.role === "business_analyst") ||
    (searchableText.includes("qa") && member.role === "qa_engineer");

  if (roleMatch) {
    score += 90;
  }

  if (member.focus.toLowerCase().includes("demo")) {
    score += 10;
  }

  if (member.focus.toLowerCase().includes("calculator")) {
    score += 25;
  }

  return score;
}

function chooseNextOwner(input: GenerateHandoverRequest) {
  if (input.nextAssignee) {
    return input.nextAssignee;
  }

  return (
    [...input.teamMembers]
      .sort(
        (left, right) =>
          scoreMember(
            right,
            input.ticket,
            input.currentAssignee?.id ?? input.ticket.assigneeId,
            input.nextAssignee?.id
          ) -
          scoreMember(
            left,
            input.ticket,
            input.currentAssignee?.id ?? input.ticket.assigneeId,
            input.nextAssignee?.id
          )
      )
      .find((member) => member.availabilityStatus !== "unavailable") ?? null
  );
}

function summarizeCommentThemes(ticketComments: TicketComment[]) {
  return ticketComments.slice(-3).map((comment) => comment.message);
}

export function buildMockGenerateHandoverResponse(
  input: GenerateHandoverRequest
): GenerateHandoverResponse {
  const nextOwner = chooseNextOwner(input);
  const blockerContext =
    input.relatedBlockerContext || input.ticket.blockerReason || "No explicit blocker is recorded.";
  const recentThemes = summarizeCommentThemes(input.ticketComments);

  return {
    summary: `${input.ticket.title} is partially advanced and needs a clean ownership handoff so progress does not stall while ${input.currentAssignee?.name ?? "the current owner"} is unavailable or switching focus.`,
    completedWork: uniqueItems([
      `Scope and current status are captured in ${input.ticket.code}.`,
      input.ticket.businessSummary,
      ...recentThemes.slice(0, 2)
    ]),
    remainingWork: uniqueItems([
      input.ticket.technicalSummary,
      blockerContext,
      ...input.ticket.dependencies.map((dependency) => `Resolve dependency: ${dependency}`)
    ]),
    unresolvedQuestions: uniqueItems([
      blockerContext,
      recentThemes[2] ?? "Confirm whether the current implementation path is still the preferred route.",
      nextOwner
        ? `Can ${nextOwner.name} take over without delaying the current review window?`
        : "Who should take over this ticket next?"
    ]),
    suggestedNextSteps: uniqueItems([
      `Review the latest comments and blocker context with ${nextOwner?.name ?? "the next owner"}.`,
      "Confirm the next owner and update ticket ownership visibly in the board.",
      "Keep the manager summary aligned with any reassignment or blocker change."
    ]),
    businessFacingSummary: `${input.ticket.title} already has useful context and partial progress recorded, but the remaining work and blocker decisions need a clear owner so the broader loan calculator delivery plan stays on track.`,
    suggestedNextOwner: nextOwner?.name ?? "No clear available owner found"
  };
}
