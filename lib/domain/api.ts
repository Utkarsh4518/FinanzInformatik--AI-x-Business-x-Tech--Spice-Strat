import type {
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket,
  TicketComment,
  TicketStatus,
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
