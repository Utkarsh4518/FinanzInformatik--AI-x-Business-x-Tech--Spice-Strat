import type { JiraImportRequest } from "@/lib/domain/api";
import { getJiraCredentials, jiraFetch } from "@/lib/server/jira/client";

type JiraSearchResponse = {
  issues: JiraIssue[];
};

export type JiraIssue = {
  id: string;
  key: string;
  fields: {
    summary?: string | null;
    description?: JiraDocumentNode | null;
    issuetype?: { name?: string | null } | null;
    priority?: { name?: string | null } | null;
    status?: { name?: string | null } | null;
    assignee?: { displayName?: string | null; emailAddress?: string | null } | null;
  };
};

type JiraDocumentNode = {
  type?: string;
  text?: string;
  content?: JiraDocumentNode[];
};

function buildIssueSearchJql(input: JiraImportRequest) {
  if (input.jql?.trim()) {
    return input.jql.trim();
  }

  const configuredProjectKey = input.projectKey?.trim() || getJiraCredentials().projectKey;

  if (configuredProjectKey) {
    return `project = "${configuredProjectKey}" ORDER BY updated DESC`;
  }

  return "ORDER BY updated DESC";
}

export function extractTextFromJiraDocument(node: JiraDocumentNode | null | undefined): string {
  if (!node) {
    return "";
  }

  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = Array.isArray(node.content)
    ? node.content.map((child) => extractTextFromJiraDocument(child)).filter(Boolean).join(" ")
    : "";

  return [ownText, childText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function fetchJiraIssues(input: JiraImportRequest = {}) {
  const jql = buildIssueSearchJql(input);
  const maxResults = Math.min(Math.max(input.maxResults ?? 20, 1), 50);
  const params = new URLSearchParams({
    jql,
    maxResults: String(maxResults),
    fields: "summary,description,issuetype,priority,status,assignee"
  });

  const payload = await jiraFetch<JiraSearchResponse>(
    `/rest/api/3/search/jql?${params.toString()}`
  );

  return payload.issues ?? [];
}
