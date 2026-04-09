import type {
  SummarizeProgressRequest,
  SummarizeProgressResponse
} from "@/lib/domain/api";

function buildTicketLine(title: string, suffix?: string) {
  return suffix ? `${title}: ${suffix}` : title;
}

export function buildMockSummarizeProgressResponse(
  input: SummarizeProgressRequest
): SummarizeProgressResponse {
  const completedTickets = input.tickets.filter((ticket) => ticket.status === "done");
  const inProgressTickets = input.tickets.filter(
    (ticket) => ticket.status === "in_progress" || ticket.status === "review"
  );
  const blockedTickets = input.tickets.filter((ticket) => ticket.blockerReason.trim());
  const unavailableMembers = input.teamMembers.filter(
    (member) => member.availabilityStatus === "unavailable"
  );
  const busyMembers = input.teamMembers.filter(
    (member) => member.availabilityStatus === "busy"
  );

  const overallStatus =
    blockedTickets.length > 0
      ? `Delivery is moving, but ${blockedTickets.length} ticket${blockedTickets.length === 1 ? "" : "s"} currently carry blocker pressure.`
      : inProgressTickets.length > 0
        ? `Delivery is actively progressing across ${inProgressTickets.length} in-flight work items.`
        : "Delivery is stable, with no active blockers currently recorded.";

  const completedItems = completedTickets.length
    ? completedTickets.map((ticket) => buildTicketLine(ticket.title))
    : ["No work items are marked done yet."];

  const inProgressItems = inProgressTickets.length
    ? inProgressTickets.map((ticket) =>
        buildTicketLine(
          ticket.title,
          ticket.status === "review" ? "awaiting review or confirmation" : "actively moving"
        )
      )
    : ["No tickets are currently in progress."];

  const blockedItems = blockedTickets.length
    ? blockedTickets.map((ticket) => buildTicketLine(ticket.title, ticket.blockerReason))
    : ["No blocked items are currently recorded."];

  const risks = [
    ...unavailableMembers.map(
      (member) =>
        `${member.name} is unavailable, which increases delivery risk around ${member.focus.toLowerCase()}`
    ),
    ...busyMembers.map(
      (member) =>
        `${member.name} is busy at ${member.capacityPercent}% capacity, so visible progress may depend on careful scope control.`
    ),
    ...(blockedTickets.length
      ? [
          "Blocked tickets could compress QA and review time if ownership decisions are delayed."
        ]
      : []),
    "Mixed business and technical wording can still create confusion if summary language is not kept aligned."
  ].slice(0, 4);

  const nextSteps = [
    blockedTickets.length
      ? `Resolve blocker ownership for ${blockedTickets[0]?.title ?? "the current blocked work"}.`
      : "Keep current in-flight tickets moving toward review.",
    unavailableMembers.length
      ? `Confirm fallback coverage for ${unavailableMembers[0]?.name ?? "the unavailable teammate"} and protect backend continuity.`
      : "Confirm ownership remains stable for the next delivery step.",
    "Prepare the next manager update using the latest ticket movement and risk view."
  ];

  const businessFacingSummary = blockedTickets.length
    ? `The loan calculator expansion is moving forward, but a few blocked items still need decisions before the team can finish cleanly. Most work is focused on clarifying scope, updating the visible experience, and keeping the demo understandable for business users.`
    : `The loan calculator expansion is progressing with active work across scope definition, interface updates, and demo readiness. The team has a clear direction and no major recorded blockers right now.`;

  const managerFacingSummary = unavailableMembers.length
    ? `The project is advancing, but manager attention is still needed on blocker resolution and capacity risk. ${unavailableMembers[0]?.name ?? "One teammate"} is unavailable, so fallback ownership and next-step clarity remain important to keep the loan calculator work on track.`
    : `The project is advancing with visible work in progress. Manager focus should stay on blocker visibility, review timing, and keeping the multilingual scope aligned with the delivery plan.`;

  return {
    overallStatus,
    completedItems,
    inProgressItems,
    blockedItems,
    risks,
    nextSteps,
    businessFacingSummary,
    managerFacingSummary
  };
}
