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

export type LanguageTranslateResponse = {
  original_text: string;
  translated_text: string;
  rewritten_text: string;
  source_language: string;
  target_language: string;
};

export type CommitFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
};

export type CommitSummary = {
  sha: string;
  message: string;
  author_name: string;
  author_avatar_url: string;
  date: string;
  url: string;
};

export type CommitDetail = CommitSummary & {
  additions: number;
  deletions: number;
  file_count: number;
  files: CommitFile[];
};

export type ExplainCommitResponse = {
  explanation: string;
  mode: string;
};

export type SidebarTab = "projects" | "websites" | "jira" | "commits";
export type MainView = "dashboard" | "project-detail" | "chat" | "jira" | "commit-detail";
