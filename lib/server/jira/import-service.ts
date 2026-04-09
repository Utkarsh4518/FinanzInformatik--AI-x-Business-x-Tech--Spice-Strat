import type {
  JiraImportRequest,
  JiraImportResponse,
  JiraSyncRunDetail,
  JiraIssuePreview
} from "@/lib/domain/api";
import {
  createJiraSyncItems,
  createJiraSyncRun,
  finalizeJiraSyncRun,
  getJiraSyncItems,
  getJiraSyncRunById,
  getJiraSyncRuns,
  getProjects,
  getTeamMembers,
  getTickets,
  upsertTickets
} from "@/lib/server/bridgeflow-repository";
import {
  mapJiraIssueToBridgeFlowTicket,
  mapJiraIssueToPreview
} from "@/lib/server/jira/mappers";
import { fetchJiraIssues } from "@/lib/server/jira/service";
import type { JiraSyncAction, Ticket } from "@/lib/domain/models";

function buildProjectKey(input: JiraImportRequest) {
  return input.projectKey?.trim() || process.env.JIRA_PROJECT_KEY?.trim() || null;
}

function areTicketsEquivalent(left: Ticket, right: Ticket) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function getJiraIssuePreviews(
  input: JiraImportRequest = {}
): Promise<JiraIssuePreview[]> {
  const issues = await fetchJiraIssues(input);
  return issues.map(mapJiraIssueToPreview);
}

export async function importJiraIssues(
  input: JiraImportRequest = {}
): Promise<JiraImportResponse> {
  const projectKey = buildProjectKey(input);
  const syncRun = await createJiraSyncRun({ projectKey });

  try {
    const [projects, teamMembers, issues, existingTickets] = await Promise.all([
      getProjects(),
      getTeamMembers(),
      fetchJiraIssues(input),
      getTickets()
    ]);

    const project =
      (input.projectId
        ? projects.find((candidate) => candidate.id === input.projectId)
        : projects[0]) ?? null;

    if (!project) {
      throw new Error("A BridgeFlow project is required before importing Jira issues.");
    }

    const existingByExternalKey = new Map(
      existingTickets
        .filter((ticket) => ticket.externalKey)
        .map((ticket) => [ticket.externalKey as string, ticket])
    );

    const importedTickets: Ticket[] = [];
    const syncItems: Array<{
      syncRunId: string;
      externalKey: string;
      actionTaken: JiraSyncAction;
      mappedTicketId: string | null;
      message?: string | null;
    }> = [];

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const issue of issues) {
      const mappedTicket = mapJiraIssueToBridgeFlowTicket(issue, project, teamMembers);
      const existingTicket = existingByExternalKey.get(issue.key) ?? null;

      if (!existingTicket) {
        importedTickets.push(mappedTicket);
        importedCount += 1;
        syncItems.push({
          syncRunId: syncRun?.id ?? "no-sync-run",
          externalKey: issue.key,
          actionTaken: "imported",
          mappedTicketId: mappedTicket.id,
          message: "Imported Jira issue into BridgeFlow."
        });
        continue;
      }

      const nextTicket: Ticket = {
        ...mappedTicket,
        id: existingTicket.id
      };

      if (areTicketsEquivalent(existingTicket, nextTicket)) {
        skippedCount += 1;
        syncItems.push({
          syncRunId: syncRun?.id ?? "no-sync-run",
          externalKey: issue.key,
          actionTaken: "skipped",
          mappedTicketId: existingTicket.id,
          message: "Jira issue already matched the current BridgeFlow ticket state."
        });
        continue;
      }

      importedTickets.push(nextTicket);
      updatedCount += 1;
      syncItems.push({
        syncRunId: syncRun?.id ?? "no-sync-run",
        externalKey: issue.key,
        actionTaken: "updated",
        mappedTicketId: existingTicket.id,
        message: "Updated existing Jira-backed BridgeFlow ticket from Jira."
      });
    }

    if (importedTickets.length) {
      await upsertTickets(importedTickets);
    }

    if (syncRun) {
      await createJiraSyncItems(syncItems.map((item) => ({ ...item, syncRunId: syncRun.id })));
      await finalizeJiraSyncRun(syncRun.id, {
        fetchedCount: issues.length,
        importedCount,
        updatedCount,
        skippedCount,
        status: "completed",
        errorMessage: null
      });
    }

    return {
      projectId: project.id,
      importedCount,
      updatedCount,
      skippedCount,
      fetchedCount: issues.length,
      projectKey,
      syncRunId: syncRun?.id ?? null,
      tickets: importedTickets,
      sourceType: "jira"
    };
  } catch (error) {
    if (syncRun) {
      await finalizeJiraSyncRun(syncRun.id, {
        fetchedCount: 0,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Jira import failed."
      });
    }

    throw error;
  }
}

export async function getJiraSyncRunSummaries() {
  return getJiraSyncRuns();
}

export async function getJiraSyncRunDetail(
  syncRunId: string
): Promise<JiraSyncRunDetail | null> {
  const [run, items] = await Promise.all([
    getJiraSyncRunById(syncRunId),
    getJiraSyncItems(syncRunId)
  ]);

  if (!run) {
    return null;
  }

  return { run, items };
}
