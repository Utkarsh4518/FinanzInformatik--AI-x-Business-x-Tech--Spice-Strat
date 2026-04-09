import type {
  JiraImportRequest,
  JiraImportResponse,
  JiraIssuePreview
} from "@/lib/domain/api";
import { getProjects, getTeamMembers, upsertTickets } from "@/lib/server/bridgeflow-repository";
import {
  mapJiraIssueToBridgeFlowTicket,
  mapJiraIssueToPreview
} from "@/lib/server/jira/mappers";
import { fetchJiraIssues } from "@/lib/server/jira/service";

export async function getJiraIssuePreviews(
  input: JiraImportRequest = {}
): Promise<JiraIssuePreview[]> {
  const issues = await fetchJiraIssues(input);
  return issues.map(mapJiraIssueToPreview);
}

export async function importJiraIssues(
  input: JiraImportRequest = {}
): Promise<JiraImportResponse> {
  const [projects, teamMembers, issues] = await Promise.all([
    getProjects(),
    getTeamMembers(),
    fetchJiraIssues(input)
  ]);

  const project =
    (input.projectId
      ? projects.find((candidate) => candidate.id === input.projectId)
      : projects[0]) ?? null;

  if (!project) {
    throw new Error("A BridgeFlow project is required before importing Jira issues.");
  }

  const tickets = issues.map((issue) =>
    mapJiraIssueToBridgeFlowTicket(issue, project, teamMembers)
  );

  await upsertTickets(tickets);

  return {
    projectId: project.id,
    importedCount: tickets.length,
    tickets,
    sourceType: "jira"
  };
}
