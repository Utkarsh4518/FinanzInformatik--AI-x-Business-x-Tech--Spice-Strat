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
import {
  bridgeFlowHandover,
  bridgeFlowProject,
  bridgeFlowRepoFileSummaries,
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

export async function getProjects() {
  return readJsonFile<Project[]>(fileNames.projects, [bridgeFlowProject]);
}

export async function getTeamMembers() {
  return readJsonFile<TeamMember[]>(fileNames.teamMembers, bridgeFlowTeamMembers);
}

export async function getTickets() {
  return readJsonFile<Ticket[]>(fileNames.tickets, bridgeFlowTickets);
}

export async function getTicketComments() {
  return readJsonFile<TicketComment[]>(
    fileNames.ticketComments,
    bridgeFlowTicketComments
  );
}

export async function getHandovers() {
  return readJsonFile<Handover[]>(fileNames.handovers, [bridgeFlowHandover]);
}

export async function getRepoFileSummaries() {
  return readJsonFile<RepoFileSummary[]>(
    fileNames.repoFileSummaries,
    bridgeFlowRepoFileSummaries
  );
}

export async function updateTicket(
  ticketId: string,
  updates: TicketUpdateInput
): Promise<Ticket | null> {
  const [tickets, teamMembers] = await Promise.all([getTickets(), getTeamMembers()]);

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

export async function createTicketComment(
  ticketId: string,
  input: CreateTicketCommentRequest
): Promise<TicketComment | null> {
  const [tickets, comments, teamMembers] = await Promise.all([
    getTickets(),
    getTicketComments(),
    getTeamMembers()
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

export async function createHandover(
  input: CreateHandoverRequest
): Promise<Handover | null> {
  const [projects, teamMembers, tickets, handovers] = await Promise.all([
    getProjects(),
    getTeamMembers(),
    getTickets(),
    getHandovers()
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
