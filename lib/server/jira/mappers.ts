import type { JiraIssuePreview } from "@/lib/domain/api";
import type {
  Project,
  TeamMember,
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType
} from "@/lib/domain/models";
import { buildJiraBrowseUrl } from "@/lib/server/jira/client";
import {
  extractTextFromJiraDocument,
  type JiraIssue
} from "@/lib/server/jira/service";

function mapJiraStatusToTicketStatus(statusName: string | null | undefined): TicketStatus {
  const normalized = (statusName ?? "").toLowerCase();

  if (normalized.includes("done") || normalized.includes("closed") || normalized.includes("resolved")) {
    return "done";
  }

  if (normalized.includes("review") || normalized.includes("qa") || normalized.includes("test")) {
    return "review";
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("development") ||
    normalized.includes("implement")
  ) {
    return "in_progress";
  }

  return "backlog";
}

function mapJiraPriorityToTicketPriority(priorityName: string | null | undefined): TicketPriority {
  const normalized = (priorityName ?? "").toLowerCase();

  if (normalized.includes("highest") || normalized.includes("blocker") || normalized.includes("critical")) {
    return "critical";
  }

  if (normalized.includes("high")) {
    return "high";
  }

  if (normalized.includes("medium")) {
    return "medium";
  }

  return "low";
}

function mapJiraTypeToTicketType(issueTypeName: string | null | undefined): TicketType {
  const normalized = (issueTypeName ?? "").toLowerCase();

  if (normalized.includes("bug")) {
    return "bug";
  }

  if (normalized.includes("research") || normalized.includes("spike")) {
    return "research";
  }

  if (normalized.includes("feature") || normalized.includes("story") || normalized.includes("epic")) {
    return "feature";
  }

  return "task";
}

function pickAssigneeId(issue: JiraIssue, teamMembers: TeamMember[]) {
  const assigneeName = issue.fields.assignee?.displayName?.trim().toLowerCase();

  if (assigneeName) {
    const directMatch = teamMembers.find(
      (member) => member.name.trim().toLowerCase() === assigneeName
    );

    if (directMatch) {
      return directMatch.id;
    }
  }

  const availableMembers = teamMembers.filter(
    (member) => member.availabilityStatus !== "unavailable"
  );

  const fallbackMember =
    availableMembers.find((member) => member.role === "frontend_engineer") ??
    availableMembers[0] ??
    teamMembers[0];

  return fallbackMember?.id ?? "";
}

function buildBusinessSummary(issue: JiraIssue, description: string) {
  return description || issue.fields.summary || "Imported from Jira.";
}

function buildTechnicalSummary(issue: JiraIssue, description: string) {
  const issueType = issue.fields.issuetype?.name ?? "Issue";
  const status = issue.fields.status?.name ?? "Open";

  return `${issueType} imported from Jira with current status "${status}". ${description || "Technical detail was not provided in the Jira issue body."}`.trim();
}

function buildBlockerReason(issue: JiraIssue) {
  const status = issue.fields.status?.name?.toLowerCase() ?? "";

  if (status.includes("blocked")) {
    return `Jira issue is currently marked as ${issue.fields.status?.name}.`;
  }

  return "";
}

export function mapJiraIssueToPreview(issue: JiraIssue): JiraIssuePreview {
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary?.trim() || issue.key,
    status: issue.fields.status?.name || "Unknown",
    priority: issue.fields.priority?.name || null,
    issueType: issue.fields.issuetype?.name || "Issue",
    assigneeName: issue.fields.assignee?.displayName || null,
    url: buildJiraBrowseUrl(issue.key)
  };
}

export function mapJiraIssueToBridgeFlowTicket(
  issue: JiraIssue,
  project: Project,
  teamMembers: TeamMember[]
): Ticket {
  const description = extractTextFromJiraDocument(issue.fields.description);
  const externalUrl = buildJiraBrowseUrl(issue.key);

  return {
    id: `ticket-jira-${issue.id}`,
    projectId: project.id,
    code: issue.key,
    title: issue.fields.summary?.trim() || issue.key,
    description: description || "Imported from Jira without a detailed description.",
    summary: issue.fields.summary?.trim() || "Imported Jira issue",
    businessSummary: buildBusinessSummary(issue, description),
    technicalSummary: buildTechnicalSummary(issue, description),
    status: mapJiraStatusToTicketStatus(issue.fields.status?.name),
    priority: mapJiraPriorityToTicketPriority(issue.fields.priority?.name),
    type: mapJiraTypeToTicketType(issue.fields.issuetype?.name),
    assigneeId: pickAssigneeId(issue, teamMembers),
    dependencies: [],
    blockerReason: buildBlockerReason(issue),
    sourceType: "jira",
    externalKey: issue.key,
    externalUrl,
    lastSyncedAt: new Date().toISOString()
  };
}
