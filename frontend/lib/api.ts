import axios from "axios";

import type {
  ChatResponse,
  JiraCreateResponse,
  JiraIssue,
  JiraProject,
  JiraUser,
  LanguageTranslateResponse,
  Mode,
  RepoDetail,
  RepoSummary,
  SpecBridgeInboxItem,
  SpecBridgeNotificationResponse,
  SpecBridgeWorkspace,
  TranslateResponse,
} from "@/lib/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001",
  headers: { "Content-Type": "application/json" },
});

export async function fetchRepos(owner: string): Promise<RepoSummary[]> {
  const { data } = await api.get<RepoSummary[]>("/github/repos", { params: { owner } });
  return data;
}

export async function fetchRepoDetail(owner: string, repo: string): Promise<RepoDetail> {
  const { data } = await api.get<RepoDetail>(`/github/repos/${owner}/${repo}`);
  return data;
}

export async function translateText(
  text: string,
  targetAudience: Mode,
  context?: string,
): Promise<TranslateResponse> {
  const { data } = await api.post<TranslateResponse>("/ai/translate", {
    text,
    target_audience: targetAudience,
    context,
  });
  return data;
}

export async function chatWithAI(
  message: string,
  mode: Mode,
  context?: string,
  history?: { role: string; content: string }[],
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/ai/chat", {
    message,
    mode,
    context,
    history: history ?? [],
  });
  return data;
}

// ── Language Translation (EN <-> DE) ────────────────────────────────

export async function translateLanguage(
  text: string,
  sourceLanguage = "en",
  targetLanguage = "de",
  audience?: Mode,
): Promise<LanguageTranslateResponse> {
  const { data } = await api.post<LanguageTranslateResponse>("/ai/translate-language", {
    text,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    audience,
  });
  return data;
}

// ── Jira ────────────────────────────────────────────────────────────

export async function fetchJiraProjects(): Promise<JiraProject[]> {
  const { data } = await api.get<JiraProject[]>("/jira/projects");
  return data;
}

export async function fetchJiraMe(): Promise<JiraUser> {
  const { data } = await api.get<JiraUser>("/jira/me");
  return data;
}

export async function fetchJiraIssues(
  projectKey?: string,
  jql?: string,
  maxResults = 30,
): Promise<JiraIssue[]> {
  const { data } = await api.get<JiraIssue[]>("/jira/issues", {
    params: { project_key: projectKey, jql, max_results: maxResults },
  });
  return data;
}

export async function fetchJiraIssue(issueKey: string): Promise<JiraIssue> {
  const { data } = await api.get<JiraIssue>(`/jira/issues/${issueKey}`);
  return data;
}

export async function createJiraIssue(
  projectKey: string,
  summary: string,
  description: string,
  issueType = "Task",
): Promise<JiraCreateResponse> {
  const { data } = await api.post<JiraCreateResponse>("/jira/issues", {
    project_key: projectKey,
    summary,
    description,
    issue_type: issueType,
  });
  return data;
}

export async function aiGenerateTicket(
  requirement: string,
  projectKey: string,
  mode: Mode,
  context?: string,
): Promise<JiraCreateResponse> {
  const { data } = await api.post<JiraCreateResponse>("/ai/generate-ticket", {
    requirement,
    project_key: projectKey,
    mode,
    context,
  });
  return data;
}

export async function fetchSpecBridgeInbox(
  projectKey?: string,
  jql?: string,
  maxResults = 10,
): Promise<SpecBridgeInboxItem[]> {
  const { data } = await api.get<SpecBridgeInboxItem[]>("/specbridge/inbox", {
    params: { project_key: projectKey, jql, max_results: maxResults },
  });
  return data;
}

export async function fetchSpecBridgeWorkspace(issueKey: string): Promise<SpecBridgeWorkspace> {
  const { data } = await api.get<SpecBridgeWorkspace>(`/specbridge/issues/${issueKey}`);
  return data;
}

export async function fetchSpecBridgeNotifications(
  maxResults = 8,
): Promise<SpecBridgeNotificationResponse> {
  const { data } = await api.get<SpecBridgeNotificationResponse>("/specbridge/notifications", {
    params: { max_results: maxResults },
  });
  return data;
}

export async function postSpecBridgeMessage(input: {
  issueKey: string;
  text: string;
  directedTo: "developer" | "requester";
  messageType?: "question" | "note" | "resolution";
  questionId?: string;
}): Promise<SpecBridgeWorkspace> {
  const { data } = await api.post<SpecBridgeWorkspace>(
    `/specbridge/issues/${input.issueKey}/messages`,
    {
      text: input.text,
      directedTo: input.directedTo,
      messageType: input.messageType ?? "question",
      questionId: input.questionId,
    },
  );
  return data;
}
