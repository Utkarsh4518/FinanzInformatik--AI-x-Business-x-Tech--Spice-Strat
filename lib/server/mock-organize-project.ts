import type {
  OrganizeProjectRequest,
  OrganizeProjectResponse
} from "@/lib/domain/api";
import type { TeamAvailabilityInput, Ticket, TicketStatus } from "@/lib/domain/models";

function getUnavailableTeammate(teamContext: TeamAvailabilityInput[]) {
  return (
    teamContext.find((member) => member.availabilityStatus === "unavailable") ??
    null
  );
}

function getAssigneeIdByName(
  teamContext: TeamAvailabilityInput[],
  assigneeName: string
) {
  return (
    teamContext.find((member) => member.name === assigneeName)?.memberId ??
    teamContext[0]?.memberId ??
    ""
  );
}

function getInitialStatus(index: number): TicketStatus {
  const orderedStatuses: TicketStatus[] = [
    "review",
    "in_progress",
    "in_progress",
    "backlog",
    "backlog",
    "backlog",
    "review",
    "backlog"
  ];

  return orderedStatuses[index] ?? "backlog";
}

export function buildMockOrganizeProjectResponse(
  input: OrganizeProjectRequest
): OrganizeProjectResponse {
  const unavailableTeammate = getUnavailableTeammate(input.teamContext);
  const repoContextLine = input.includeRepoContext
    ? "The local repo snapshot should be used to highlight likely frontend, API, and handover touchpoints."
    : "Repo context is intentionally excluded, so file-impact analysis stays as a follow-up question.";
  const languageLine =
    input.targetLanguage === "Bilingual"
      ? "Output should stay readable for both English and German stakeholders."
      : `Output should be manager-friendly in ${input.targetLanguage}.`;

  return {
    projectSummary:
      "BridgeFlow organized the multilingual loan calculator request into a focused delivery plan for adding loan term calculation while keeping business visibility high and covering the temporary backend capacity gap.",
    clarifiedScope: [
      "Extend the loan calculator so users can calculate loan term from payment-driven inputs.",
      "Keep business wording and technical execution aligned across mixed English and German notes.",
      repoContextLine,
      languageLine
    ],
    openQuestions: [
      "Should the loan term calculation reuse the existing calculation contract or introduce a new backend handler?",
      "Which exact business labels must be shown to managers in German versus English during the demo?",
      "Does the manager want unsupported payment combinations blocked or explained with fallback guidance?"
    ],
    risks: [
      unavailableTeammate
        ? `${unavailableTeammate.name} is currently unavailable, so backend ownership and contract confirmation may slip.`
        : "Backend contract confirmation is still a scheduling risk.",
      "Mixed-language requirements can create inconsistent labels unless business and frontend copy stay aligned.",
      "Validation and edge-case coverage may lag if QA scenarios are not locked early."
    ],
    tickets: [
      {
        title: "Finalize multilingual scope baseline",
        description:
          "Consolidate the mixed English and German notes into one approved scope baseline for the loan term calculation extension.",
        businessSummary:
          "Gives managers a single agreed scope before delivery work expands.",
        technicalSummary:
          "Provides a stable reference for acceptance criteria, labels, and ticket boundaries.",
        type: "task",
        priority: "high",
        suggestedAssigneeName: "Lukas Weber",
        dependencies: [],
        estimateHours: 4
      },
      {
        title: "Define acceptance criteria for loan term calculation",
        description:
          "Turn the manager request into explicit rules for direct and reverse loan term calculation scenarios.",
        businessSummary:
          "Clarifies what the manager expects to see in the demo output.",
        technicalSummary:
          "Locks the input combinations, validation rules, and result expectations needed for implementation.",
        type: "feature",
        priority: "critical",
        suggestedAssigneeName: "Lukas Weber",
        dependencies: ["Finalize multilingual scope baseline"],
        estimateHours: 6
      },
      {
        title: "Update calculator UI for loan term output",
        description:
          "Extend the current calculator flow so the interface supports loan term calculation alongside existing scenarios.",
        businessSummary:
          "Introduces the visible product change the manager wants to demo.",
        technicalSummary:
          "Requires new input states, conditional rendering, and manager-friendly copy updates.",
        type: "feature",
        priority: "high",
        suggestedAssigneeName: "Maya Patel",
        dependencies: ["Define acceptance criteria for loan term calculation"],
        estimateHours: 10
      },
      {
        title: "Refine validation and bilingual empty states",
        description:
          "Improve validation messaging so incorrect or incomplete calculator input remains understandable in the demo.",
        businessSummary:
          "Protects the manager-facing experience from confusing edge cases.",
        technicalSummary:
          "Touches field validation, fallback states, and copy consistency for both language contexts.",
        type: "task",
        priority: "medium",
        suggestedAssigneeName: "Maya Patel",
        dependencies: ["Update calculator UI for loan term output"],
        estimateHours: 6
      },
      {
        title: "Align backend contract for loan term calculation",
        description:
          "Clarify payload shape, ownership, and response handling for the calculation contract before implementation continues.",
        businessSummary:
          "Keeps the delivery plan realistic even with temporary backend capacity pressure.",
        technicalSummary:
          "Defines request fields, response structure, and fallback ownership while backend availability is limited.",
        type: "feature",
        priority: "high",
        suggestedAssigneeName: unavailableTeammate ? "Ava Chen" : "Noah Garcia",
        dependencies: ["Define acceptance criteria for loan term calculation"],
        estimateHours: 5
      },
      {
        title: "Prepare QA coverage for loan term scenarios",
        description:
          "Document and execute QA coverage for positive, negative, and edge-case loan term paths.",
        businessSummary:
          "Improves manager confidence that the demo is stable and review-ready.",
        technicalSummary:
          "Covers regression, rounding behavior, and mixed-language validation cases.",
        type: "task",
        priority: "high",
        suggestedAssigneeName: "Zoe Schmidt",
        dependencies: [
          "Update calculator UI for loan term output",
          "Refine validation and bilingual empty states"
        ],
        estimateHours: 8
      },
      {
        title: "Draft manager progress summary",
        description:
          "Create a business-friendly progress summary that explains the scope, current status, and key decisions.",
        businessSummary:
          "Keeps managers informed without forcing them into technical detail.",
        technicalSummary:
          "Summarizes workstream progress and dependencies into a concise stakeholder update.",
        type: "task",
        priority: "medium",
        suggestedAssigneeName: "Ava Chen",
        dependencies: ["Define acceptance criteria for loan term calculation"],
        estimateHours: 3
      },
      {
        title: "Capture backend handover path",
        description:
          "Prepare a fallback handover path so the team can continue if the unavailable backend teammate cannot rejoin in time.",
        businessSummary:
          "Reduces single-owner risk in the hackathon demo plan.",
        technicalSummary:
          "Packages ownership notes, open questions, and next steps for temporary reassignment.",
        type: "research",
        priority: "medium",
        suggestedAssigneeName: "Ava Chen",
        dependencies: ["Align backend contract for loan term calculation"],
        estimateHours: 4
      }
    ],
    assignmentSuggestions: [
      "Lukas Weber should continue owning multilingual requirements cleanup and acceptance criteria because he bridges business and German context.",
      "Maya Patel should own the visible calculator changes and validation polish because the UI work is the clearest demo surface.",
      unavailableTeammate
        ? `Route backend coordination through Ava Chen while ${unavailableTeammate.name} remains unavailable.`
        : "Keep backend contract work with Noah Garcia.",
      "Zoe Schmidt should lock QA scenarios early so edge cases do not undermine the final demo."
    ]
  };
}

export function buildPersistedTicketsFromOrganizeResponse(
  input: OrganizeProjectRequest,
  response: OrganizeProjectResponse
): Ticket[] {
  const unavailableTeammate = getUnavailableTeammate(input.teamContext);

  return response.tickets.map((ticket, index) => ({
    id: `ticket-ai-${index + 1}`,
    projectId: input.projectId,
    code: `BF-AI-${String(index + 1).padStart(2, "0")}`,
    title: ticket.title,
    description: ticket.description,
    summary: ticket.businessSummary,
    businessSummary: ticket.businessSummary,
    technicalSummary: ticket.technicalSummary,
    status: getInitialStatus(index),
    priority: ticket.priority,
    type: ticket.type,
    assigneeId: getAssigneeIdByName(input.teamContext, ticket.suggestedAssigneeName),
    dependencies: ticket.dependencies,
    blockerReason:
      unavailableTeammate && ticket.title.includes("backend")
        ? `${unavailableTeammate.name} is unavailable, so backend confirmation is routed through fallback ownership.`
        : ticket.dependencies.length > 1
          ? `Waiting on: ${ticket.dependencies.join(", ")}`
          : "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  }));
}
