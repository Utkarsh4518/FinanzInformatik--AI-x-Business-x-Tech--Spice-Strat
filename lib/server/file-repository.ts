import { randomUUID } from "node:crypto";

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
import { curatedRepoFileSummaries } from "@/lib/repo-context";
import {
  bridgeFlowHandover,
  bridgeFlowProject,
  bridgeFlowTeamMembers,
  bridgeFlowTicketComments,
  bridgeFlowTickets
} from "@/lib/seed/bridgeflow-data";
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store";

const fileNames = {
  projects: "projects.json",
  teamMembers: "team-members.json",
  tickets: "tickets.json",
  ticketComments: "ticket-comments.json",
  handovers: "handovers.json",
  repoFileSummaries: "repo-file-summaries.json"
} as const;

type StoredTicket = Omit<
  Ticket,
  "sourceType" | "externalKey" | "externalUrl" | "lastSyncedAt"
> & {
  sourceType?: Ticket["sourceType"];
  externalKey?: string | null;
  externalUrl?: string | null;
  lastSyncedAt?: string | null;
};

function normalizeTicket(ticket: StoredTicket): Ticket {
  return {
    ...ticket,
    sourceType: ticket.sourceType ?? "local",
    externalKey: ticket.externalKey ?? null,
    externalUrl: ticket.externalUrl ?? null,
    lastSyncedAt: ticket.lastSyncedAt ?? null
  };
}

export async function getProjectsFromFiles() {
  return readJsonFile<Project[]>(fileNames.projects, [bridgeFlowProject]);
}

export async function getTeamMembersFromFiles() {
  return readJsonFile<TeamMember[]>(fileNames.teamMembers, bridgeFlowTeamMembers);
}

export async function getTicketsFromFiles() {
  const tickets = await readJsonFile<StoredTicket[]>(
    fileNames.tickets,
    bridgeFlowTickets
  );
  return tickets.map(normalizeTicket);
}

export async function getTicketCommentsFromFiles() {
  return readJsonFile<TicketComment[]>(
    fileNames.ticketComments,
    bridgeFlowTicketComments
  );
}

export async function getHandoversFromFiles() {
  return readJsonFile<Handover[]>(fileNames.handovers, [bridgeFlowHandover]);
}

export async function getRepoFileSummariesFromFiles() {
  return curatedRepoFileSummaries satisfies RepoFileSummary[];
}

export async function replaceTicketsInFiles(tickets: Ticket[]) {
  const currentTickets = await getTicketsFromFiles();
  const projectIds = new Set(tickets.map((ticket) => ticket.projectId));
  const preservedTickets = currentTickets.filter(
    (ticket) =>
      ticket.sourceType === "jira" || !projectIds.has(ticket.projectId)
  );
  const nextTickets = [...preservedTickets, ...tickets];
  await writeJsonFile(fileNames.tickets, nextTickets);
  return nextTickets;
}

export async function upsertTicketsInFiles(tickets: Ticket[]) {
  const currentTickets = await getTicketsFromFiles();
  const nextTicketsById = new Map(currentTickets.map((ticket) => [ticket.id, ticket]));

  for (const ticket of tickets) {
    nextTicketsById.set(ticket.id, ticket);
  }

  const nextTickets = Array.from(nextTicketsById.values());
  await writeJsonFile(fileNames.tickets, nextTickets);
  return nextTickets;
}

export async function updateTicketInFiles(
  ticketId: string,
  updates: TicketUpdateInput
): Promise<Ticket | null> {
  const [tickets, teamMembers] = await Promise.all([
    getTicketsFromFiles(),
    getTeamMembersFromFiles()
  ]);

  if (!teamMembers.some((member) => member.id === updates.assigneeId)) {
    return null;
  }

  const updatedTickets = tickets.map((ticket) =>
    ticket.id === ticketId ? { ...ticket, ...updates } : ticket
  );
  const updatedTicket =
    updatedTickets.find((ticket) => ticket.id === ticketId) ?? null;

  if (!updatedTicket) {
    return null;
  }

  await writeJsonFile(fileNames.tickets, updatedTickets);
  return updatedTicket;
}

export async function createTicketCommentInFiles(
  ticketId: string,
  input: CreateTicketCommentRequest
): Promise<TicketComment | null> {
  const [tickets, comments, teamMembers] = await Promise.all([
    getTicketsFromFiles(),
    getTicketCommentsFromFiles(),
    getTeamMembersFromFiles()
  ]);

  const ticketExists = tickets.some((ticket) => ticket.id === ticketId);
  const authorExists = teamMembers.some((member) => member.id === input.authorId);

  if (!ticketExists || !authorExists) {
    return null;
  }

  const comment: TicketComment = {
    id: `comment-${randomUUID()}`,
    ticketId,
    authorId: input.authorId,
    message: input.message.trim(),
    createdAt: new Date().toISOString()
  };

  const nextComments = [...comments, comment];
  await writeJsonFile(fileNames.ticketComments, nextComments);
  return comment;
}

export async function createHandoverInFiles(
  input: CreateHandoverRequest
): Promise<Handover | null> {
  const [projects, teamMembers, tickets, handovers] = await Promise.all([
    getProjectsFromFiles(),
    getTeamMembersFromFiles(),
    getTicketsFromFiles(),
    getHandoversFromFiles()
  ]);

  const projectExists = projects.some((project) => project.id === input.projectId);
  const unavailableMemberExists = teamMembers.some(
    (member) => member.id === input.unavailableMemberId
  );
  const fallbackOwnerExists = teamMembers.some(
    (member) => member.id === input.fallbackOwnerId
  );
  const ticketIdsAreValid = input.openTicketIds.every((ticketId) =>
    tickets.some((ticket) => ticket.id === ticketId)
  );

  if (
    !projectExists ||
    !unavailableMemberExists ||
    !fallbackOwnerExists ||
    !ticketIdsAreValid
  ) {
    return null;
  }

  const handover: Handover = {
    id: `handover-${randomUUID()}`,
    projectId: input.projectId,
    unavailableMemberId: input.unavailableMemberId,
    fallbackOwnerId: input.fallbackOwnerId,
    summary: input.summary.trim(),
    openTicketIds: input.openTicketIds,
    blockers: input.blockers.map((blocker) => blocker.trim()).filter(Boolean)
  };

  const nextHandovers = [handover, ...handovers];
  await writeJsonFile(fileNames.handovers, nextHandovers);
  return handover;
}

export async function resetDemoWorkspaceInFiles() {
  await Promise.all([
    writeJsonFile(fileNames.projects, [bridgeFlowProject]),
    writeJsonFile(fileNames.teamMembers, bridgeFlowTeamMembers),
    writeJsonFile(fileNames.tickets, bridgeFlowTickets),
    writeJsonFile(fileNames.ticketComments, bridgeFlowTicketComments),
    writeJsonFile(fileNames.handovers, [bridgeFlowHandover])
  ]);
}
