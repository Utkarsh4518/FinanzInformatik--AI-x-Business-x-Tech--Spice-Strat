import type {
  AppRole,
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

export type GenerateHandoverRequest = {
  ticket: Ticket;
  currentAssignee: TeamMember | null;
  nextAssignee?: TeamMember | null;
  availableTeamMembers: TeamMember[];
  ticketComments: TicketComment[];
  projectSummary: string;
  currentRoleView: AppRole;
  blockerContext?: string;
};

export type GenerateHandoverResponse = {
  summary: string;
  completedWork: string[];
  remainingWork: string[];
  unresolvedQuestions: string[];
  suggestedNextSteps: string[];
  businessFacingSummary: string;
  suggestedNextOwner: string;
};

export type SummarizeProgressRequest = {
  project: Project;
  tickets: Ticket[];
  teamMembers: TeamMember[];
  comments: TicketComment[];
};

export type SummarizeProgressResponse = {
  overallStatus: string;
  completedItems: string[];
  inProgressItems: string[];
  blockedItems: string[];
  risks: string[];
  nextSteps: string[];
  businessFacingSummary: string;
  managerFacingSummary: string;
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

export function isSummarizeProgressRequest(
  value: unknown
): value is SummarizeProgressRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    !!candidate.project &&
    typeof candidate.project === "object" &&
    typeof (candidate.project as Project).id === "string" &&
    Array.isArray(candidate.tickets) &&
    candidate.tickets.every((ticket) => {
      if (!ticket || typeof ticket !== "object") {
        return false;
      }

      const candidateTicket = ticket as Record<string, unknown>;

      return (
        typeof candidateTicket.id === "string" &&
        typeof candidateTicket.title === "string" &&
        typeof candidateTicket.status === "string" &&
        typeof candidateTicket.blockerReason === "string"
      );
    }) &&
    Array.isArray(candidate.teamMembers) &&
    candidate.teamMembers.every((member) => {
      if (!member || typeof member !== "object") {
        return false;
      }

      const candidateMember = member as Record<string, unknown>;

      return (
        typeof candidateMember.id === "string" &&
        typeof candidateMember.name === "string" &&
        typeof candidateMember.availabilityStatus === "string" &&
        typeof candidateMember.capacityPercent === "number"
      );
    }) &&
    Array.isArray(candidate.comments) &&
    candidate.comments.every((comment) => {
      if (!comment || typeof comment !== "object") {
        return false;
      }

      const candidateComment = comment as Record<string, unknown>;

      return (
        typeof candidateComment.id === "string" &&
        typeof candidateComment.ticketId === "string" &&
        typeof candidateComment.authorId === "string" &&
        typeof candidateComment.message === "string"
      );
    })
  );
}

export function isGenerateHandoverRequest(
  value: unknown
): value is GenerateHandoverRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !candidate.ticket ||
    typeof candidate.ticket !== "object" ||
    !Array.isArray(candidate.availableTeamMembers) ||
    !Array.isArray(candidate.ticketComments) ||
    typeof candidate.projectSummary !== "string" ||
    (candidate.currentRoleView !== "manager" &&
      candidate.currentRoleView !== "analyst" &&
      candidate.currentRoleView !== "developer")
  ) {
    return false;
  }

  const candidateTicket = candidate.ticket as Record<string, unknown>;

  return (
    typeof candidateTicket.id === "string" &&
    typeof candidateTicket.title === "string" &&
    typeof candidateTicket.description === "string" &&
    typeof candidateTicket.technicalSummary === "string" &&
    typeof candidateTicket.businessSummary === "string" &&
    typeof candidateTicket.assigneeId === "string" &&
    candidate.availableTeamMembers.every((member) => {
      if (!member || typeof member !== "object") {
        return false;
      }

      const candidateMember = member as Record<string, unknown>;

      return (
        typeof candidateMember.id === "string" &&
        typeof candidateMember.name === "string" &&
        typeof candidateMember.role === "string" &&
        typeof candidateMember.availabilityStatus === "string" &&
        typeof candidateMember.capacityPercent === "number"
      );
    }) &&
    candidate.ticketComments.every((comment) => {
      if (!comment || typeof comment !== "object") {
        return false;
      }

      const candidateComment = comment as Record<string, unknown>;

      return (
        typeof candidateComment.id === "string" &&
        typeof candidateComment.ticketId === "string" &&
        typeof candidateComment.message === "string"
      );
    }) &&
    (candidate.currentAssignee === null ||
      candidate.currentAssignee === undefined ||
      (typeof candidate.currentAssignee === "object" &&
        typeof (candidate.currentAssignee as TeamMember).id === "string")) &&
    (candidate.nextAssignee === null ||
      candidate.nextAssignee === undefined ||
      (typeof candidate.nextAssignee === "object" &&
        typeof (candidate.nextAssignee as TeamMember).id === "string")) &&
    (candidate.blockerContext === undefined ||
      typeof candidate.blockerContext === "string")
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

export function isSummarizeProgressResponse(
  value: unknown
): value is SummarizeProgressResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.overallStatus === "string" &&
    Array.isArray(candidate.completedItems) &&
    candidate.completedItems.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.inProgressItems) &&
    candidate.inProgressItems.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.blockedItems) &&
    candidate.blockedItems.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.risks) &&
    candidate.risks.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.nextSteps) &&
    candidate.nextSteps.every((entry) => typeof entry === "string") &&
    typeof candidate.businessFacingSummary === "string" &&
    typeof candidate.managerFacingSummary === "string"
  );
}

export function isGenerateHandoverResponse(
  value: unknown
): value is GenerateHandoverResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.completedWork) &&
    candidate.completedWork.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.remainingWork) &&
    candidate.remainingWork.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.unresolvedQuestions) &&
    candidate.unresolvedQuestions.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.suggestedNextSteps) &&
    candidate.suggestedNextSteps.every((entry) => typeof entry === "string") &&
    typeof candidate.businessFacingSummary === "string" &&
    typeof candidate.suggestedNextOwner === "string"
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
