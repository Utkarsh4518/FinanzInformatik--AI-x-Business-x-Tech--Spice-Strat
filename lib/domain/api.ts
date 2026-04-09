import type {
  Handover,
  Project,
  RepoFileSummary,
  TargetOutputLanguage,
  TeamMember,
  TeamAvailabilityInput,
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  TicketType,
  TicketUpdateInput
} from "@/lib/domain/models";

export type ApiErrorResponse = {
  error: string;
};

export type ApiItemResponse<T> = {
  data: T;
};

export type ApiListResponse<T> = {
  data: T[];
};

export type CreateTicketCommentRequest = {
  authorId: string;
  message: string;
};

export type CreateHandoverRequest = {
  projectId: string;
  unavailableMemberId: string;
  fallbackOwnerId: string;
  summary: string;
  openTicketIds: string[];
  blockers: string[];
};

export type TranslateMode =
  | "business-to-technical"
  | "technical-to-business"
  | "normalize";

export type TranslateRequest = {
  text: string;
  targetLanguage: "English" | "German";
  mode: TranslateMode;
};

export type TranslateResponse = {
  sourceLanguageDetected: string;
  translatedText: string;
  conciseExplanation: string;
};

export type OrganizeProjectRequest = {
  projectId: string;
  rawInput: string;
  teamContext: TeamAvailabilityInput[];
  includeRepoContext: boolean;
  targetLanguage: TargetOutputLanguage;
};

export type OrganizeProjectTicketSuggestion = {
  title: string;
  description: string;
  businessSummary: string;
  technicalSummary: string;
  type: TicketType;
  priority: TicketPriority;
  suggestedAssigneeName: string;
  dependencies: string[];
  estimateHours: number;
};

export type OrganizeProjectResponse = {
  projectSummary: string;
  clarifiedScope: string[];
  openQuestions: string[];
  risks: string[];
  tickets: OrganizeProjectTicketSuggestion[];
  assignmentSuggestions: string[];
};

export type BootstrapResponse = {
  project: Project | null;
  teamMembers: TeamMember[];
  tickets: Ticket[];
  ticketComments: TicketComment[];
  handovers: Handover[];
  repoFileSummaries: RepoFileSummary[];
};

export const ticketStatusValues: TicketStatus[] = [
  "backlog",
  "in_progress",
  "review",
  "done"
];

export const ticketPriorityValues: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "critical"
];

export const ticketTypeValues: TicketType[] = [
  "feature",
  "task",
  "bug",
  "research"
];

export function isTicketUpdateInput(value: unknown): value is TicketUpdateInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.assigneeId === "string" &&
    typeof candidate.blockerReason === "string" &&
    typeof candidate.status === "string" &&
    ticketStatusValues.includes(candidate.status as TicketStatus)
  );
}

export function isCreateTicketCommentRequest(
  value: unknown
): value is CreateTicketCommentRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.authorId === "string" &&
    typeof candidate.message === "string" &&
    candidate.message.trim().length > 0
  );
}

export function isOrganizeProjectRequest(
  value: unknown
): value is OrganizeProjectRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.projectId === "string" &&
    typeof candidate.rawInput === "string" &&
    typeof candidate.includeRepoContext === "boolean" &&
    typeof candidate.targetLanguage === "string" &&
    Array.isArray(candidate.teamContext) &&
    candidate.teamContext.every((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const teamEntry = entry as Record<string, unknown>;

      return (
        typeof teamEntry.memberId === "string" &&
        typeof teamEntry.name === "string" &&
        typeof teamEntry.role === "string" &&
        typeof teamEntry.availabilityStatus === "string" &&
        typeof teamEntry.capacityPercent === "number"
      );
    })
  );
}

export function isTranslateRequest(value: unknown): value is TranslateRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.text === "string" &&
    candidate.text.trim().length > 0 &&
    (candidate.targetLanguage === "English" ||
      candidate.targetLanguage === "German") &&
    (candidate.mode === "business-to-technical" ||
      candidate.mode === "technical-to-business" ||
      candidate.mode === "normalize")
  );
}

export function isTranslateResponse(value: unknown): value is TranslateResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sourceLanguageDetected === "string" &&
    typeof candidate.translatedText === "string" &&
    typeof candidate.conciseExplanation === "string"
  );
}

export function isOrganizeProjectResponse(
  value: unknown
): value is OrganizeProjectResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.projectSummary === "string" &&
    Array.isArray(candidate.clarifiedScope) &&
    candidate.clarifiedScope.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.openQuestions) &&
    candidate.openQuestions.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.risks) &&
    candidate.risks.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.assignmentSuggestions) &&
    candidate.assignmentSuggestions.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.tickets) &&
    candidate.tickets.every((ticket) => {
      if (!ticket || typeof ticket !== "object") {
        return false;
      }

      const candidateTicket = ticket as Record<string, unknown>;

      return (
        typeof candidateTicket.title === "string" &&
        typeof candidateTicket.description === "string" &&
        typeof candidateTicket.businessSummary === "string" &&
        typeof candidateTicket.technicalSummary === "string" &&
        typeof candidateTicket.suggestedAssigneeName === "string" &&
        typeof candidateTicket.estimateHours === "number" &&
        candidateTicket.estimateHours >= 0 &&
        typeof candidateTicket.type === "string" &&
        ticketTypeValues.includes(candidateTicket.type as TicketType) &&
        typeof candidateTicket.priority === "string" &&
        ticketPriorityValues.includes(candidateTicket.priority as TicketPriority) &&
        Array.isArray(candidateTicket.dependencies) &&
        candidateTicket.dependencies.every((entry) => typeof entry === "string")
      );
    })
  );
}

export function isCreateHandoverRequest(
  value: unknown
): value is CreateHandoverRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.projectId === "string" &&
    typeof candidate.unavailableMemberId === "string" &&
    typeof candidate.fallbackOwnerId === "string" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.openTicketIds) &&
    candidate.openTicketIds.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.blockers) &&
    candidate.blockers.every((entry) => typeof entry === "string")
  );
}
