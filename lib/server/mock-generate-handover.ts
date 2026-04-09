import type {
  GenerateHandoverRequest,
  GenerateHandoverResponse
} from "@/lib/domain/api";
import type { TeamMember, Ticket, TicketComment } from "@/lib/domain/models";

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim())));
}

function detectLanguageNeeds(input: GenerateHandoverRequest) {
  const text = `${input.projectSummary} ${input.ticket.title} ${input.ticket.description} ${input.ticket.businessSummary} ${input.ticket.technicalSummary} ${input.blockerContext ?? ""}`.toLowerCase();
  const needsGerman =
    text.includes("multilingual") ||
    text.includes("german") ||
    text.includes("deutsch") ||
    ["laufzeit", "kredit", "berechnung", "anforderung"].some((word) =>
      text.includes(word)
    );
  const needsEnglish = text.includes("english") || text.includes("bilingual") || true;

  return { needsGerman, needsEnglish };
}

function scoreMember(
  member: TeamMember,
  input: GenerateHandoverRequest,
  requestedNextAssigneeId?: string
) {
  if (member.id === requestedNextAssigneeId) {
    return 10_000;
  }

  if (member.availabilityStatus === "unavailable") {
    return -10_000;
  }

  let score = member.capacityPercent;
  const languageNeeds = detectLanguageNeeds(input);
  const currentAssigneeId = input.currentAssignee?.id ?? input.ticket.assigneeId;

  if (member.id === currentAssigneeId) {
    score -= 250;
  }

  if (member.availabilityStatus === "available") {
    score += 120;
  }

  if (member.availabilityStatus === "busy") {
    score -= 40;
  }

  const searchableText = `${input.ticket.title} ${input.ticket.description} ${input.ticket.technicalSummary} ${input.ticket.businessSummary}`.toLowerCase();
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

  if (languageNeeds.needsGerman && member.languages.includes("German")) {
    score += 45;
  }

  if (languageNeeds.needsEnglish && member.languages.includes("English")) {
    score += 20;
  }

  if (languageNeeds.needsGerman && languageNeeds.needsEnglish && member.languages.length > 1) {
    score += 20;
  }

  if (
    input.currentAssignee &&
    member.languages.some((language) => input.currentAssignee?.languages.includes(language))
  ) {
    score += 15;
  }

  return score;
}

function chooseNextOwner(input: GenerateHandoverRequest) {
  if (input.nextAssignee) {
    return input.nextAssignee;
  }

  return (
    [...input.availableTeamMembers]
      .sort(
        (left, right) =>
          scoreMember(right, input, input.nextAssignee?.id) -
          scoreMember(left, input, input.nextAssignee?.id)
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
    input.blockerContext || input.ticket.blockerReason || "No explicit blocker is recorded.";
  const recentThemes = summarizeCommentThemes(input.ticketComments);
  const reassignmentImpact = nextOwner
    ? `${nextOwner.name} is the strongest fallback owner based on current availability, capacity, and context fit.`
    : "No clear fallback owner is visible from the current available team context.";

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
    businessFacingSummary: `${input.ticket.title} already has useful context and partial progress recorded, but the remaining work and blocker decisions need a clear owner so the broader loan calculator delivery plan stays on track. ${reassignmentImpact}`,
    suggestedNextOwner: nextOwner?.name ?? "No clear available owner found"
  };
}
