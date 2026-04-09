export type Mode = "business" | "developer";

export type RepoSummary = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string | null;
  topics: string[];
  fork?: boolean;
};

export type RepoDetail = RepoSummary & {
  created_at: string | null;
  readme: string | null;
  languages: Record<string, number>;
  default_branch: string;
};

export type TranslateResponse = {
  translated: string;
  target_audience: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type ChatResponse = {
  reply: string;
  mode: string;
};

export type Website = {
  name: string;
  url: string;
  description: string;
  category: string;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  businessPrompt: string;
  developerPrompt: string;
  icon: string;
};

export type JiraProject = {
  key: string;
  name: string;
  project_type: string;
  style: string;
  url: string;
};

export type JiraIssue = {
  key: string;
  summary: string;
  description: string;
  status: string;
  status_category: string;
  priority: string;
  issue_type: string;
  assignee: string;
  reporter: string;
  project_key: string;
  project_name: string;
  created: string;
  updated: string;
  labels: string[];
  url: string;
};

export type JiraCreateResponse = {
  key: string;
  url: string;
  id: string;
};

export type SidebarTab = "projects" | "websites" | "scenarios" | "jira";
export type MainView = "dashboard" | "project-detail" | "scenarios" | "chat" | "jira";
