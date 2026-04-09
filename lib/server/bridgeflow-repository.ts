import type {
  CreateHandoverRequest,
  CreateTicketCommentRequest
} from "@/lib/domain/api";
import type {
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket,
  TicketComment,
  TicketUpdateInput
} from "@/lib/domain/models";
import { hasPostgresConfig } from "@/lib/server/postgres/client";
import {
  createHandoverInPostgres,
  createTicketCommentInPostgres,
  getHandoversFromPostgres,
  getProjectsFromPostgres,
  getTeamMembersFromPostgres,
  getTicketCommentsFromPostgres,
  getTicketsFromPostgres,
  replaceTicketsInPostgres,
  resetDemoWorkspaceInPostgres,
  updateTicketInPostgres
} from "@/lib/server/postgres/repository";
import {
  createHandoverInFiles,
  createTicketCommentInFiles,
  getHandoversFromFiles,
  getProjectsFromFiles,
  getRepoFileSummariesFromFiles,
  getTeamMembersFromFiles,
  getTicketCommentsFromFiles,
  getTicketsFromFiles,
  replaceTicketsInFiles,
  resetDemoWorkspaceInFiles,
  updateTicketInFiles
} from "@/lib/server/file-repository";

function canUseFileFallback() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.BRIDGEFLOW_ALLOW_FILE_FALLBACK === "true"
  );
}

async function runWithPrimaryStorage<T>(
  operationName: string,
  postgresOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>
) {
  if (!hasPostgresConfig()) {
    if (canUseFileFallback()) {
      return fallbackOperation();
    }

    throw new Error(
      `DATABASE_URL is required for ${operationName} when file fallback is disabled.`
    );
  }

  try {
    return await postgresOperation();
  } catch (error) {
    if (canUseFileFallback()) {
      console.warn(
        `[BridgeFlow] Falling back to file storage for ${operationName}.`,
        error
      );
      return fallbackOperation();
    }

    throw error;
  }
}

export async function getProjects() {
  return runWithPrimaryStorage<Project[]>(
    "getProjects",
    getProjectsFromPostgres,
    getProjectsFromFiles
  );
}

export async function getTeamMembers() {
  return runWithPrimaryStorage<TeamMember[]>(
    "getTeamMembers",
    getTeamMembersFromPostgres,
    getTeamMembersFromFiles
  );
}

export async function getTickets() {
  return runWithPrimaryStorage<Ticket[]>(
    "getTickets",
    getTicketsFromPostgres,
    getTicketsFromFiles
  );
}

export async function getTicketComments() {
  return runWithPrimaryStorage<TicketComment[]>(
    "getTicketComments",
    getTicketCommentsFromPostgres,
    getTicketCommentsFromFiles
  );
}

export async function getHandovers() {
  return runWithPrimaryStorage<Handover[]>(
    "getHandovers",
    getHandoversFromPostgres,
    getHandoversFromFiles
  );
}

export async function getRepoFileSummaries() {
  return getRepoFileSummariesFromFiles();
}

export async function replaceTickets(tickets: Ticket[]) {
  return runWithPrimaryStorage<Ticket[]>(
    "replaceTickets",
    () => replaceTicketsInPostgres(tickets),
    () => replaceTicketsInFiles(tickets)
  );
}

export async function updateTicket(
  ticketId: string,
  updates: TicketUpdateInput
): Promise<Ticket | null> {
  return runWithPrimaryStorage<Ticket | null>(
    "updateTicket",
    () => updateTicketInPostgres(ticketId, updates),
    () => updateTicketInFiles(ticketId, updates)
  );
}

export async function createTicketComment(
  ticketId: string,
  input: CreateTicketCommentRequest
): Promise<TicketComment | null> {
  return runWithPrimaryStorage<TicketComment | null>(
    "createTicketComment",
    () => createTicketCommentInPostgres(ticketId, input),
    () => createTicketCommentInFiles(ticketId, input)
  );
}

export async function createHandover(
  input: CreateHandoverRequest
): Promise<Handover | null> {
  return runWithPrimaryStorage<Handover | null>(
    "createHandover",
    () => createHandoverInPostgres(input),
    () => createHandoverInFiles(input)
  );
}

export async function resetDemoWorkspace() {
  return runWithPrimaryStorage<void>(
    "resetDemoWorkspace",
    resetDemoWorkspaceInPostgres,
    resetDemoWorkspaceInFiles
  );
}
