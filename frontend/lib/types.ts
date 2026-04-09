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
  components: string[];
  assignee_account_id: string;
  reporter_account_id: string;
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

export type SidebarTab = "projects" | "websites" | "scenarios" | "jira";
export type MainView = "dashboard" | "project-detail" | "scenarios" | "chat" | "jira";

export type JiraUser = {
  accountId: string;
  displayName: string;
  emailAddress?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
};

export type JiraTransition = {
  id: string;
  name: string;
  toStatus: string;
};

export type SpecBridgePerson = JiraUser & {
  role?: string;
};

export type SpecBridgeCandidate = JiraUser & {
  role: string;
  totalScore: number;
  profileSource: string;
  isAssignable: boolean;
  reasons: string[];
  risks?: string[];
  recentTickets?: string[];
  breakdown?: Record<string, number>;
};

export type SpecBridgeMessage = {
  id: string;
  messageType: "question" | "note" | "resolution" | "comment";
  text: string;
  authorAccountId: string;
  authorDisplayName: string;
  directedTo?: "developer" | "requester" | null;
  businessRewrite?: string | null;
  technicalRewrite?: string | null;
  createdAt: string;
  source: "jira" | "specbridge";
  questionId?: string | null;
};

export type SpecBridgeQuestion = {
  id: string;
  text: string;
  askedByDisplayName: string;
  askedAt: string;
  directedTo: "developer" | "requester";
  businessRewrite?: string;
  technicalRewrite?: string;
  resolution?: string;
  resolvedAt?: string;
};

export type SpecBridgeLifecycleEvent = {
  eventType: string;
  timestamp: string;
  aiInterpretation: string;
};

export type SpecBridgeInboxItem = {
  issueKey: string;
  summary: string;
  status: string;
  priority: string;
  updatedAt: string;
  url: string;
  reporter: JiraUser | null;
  assignee: JiraUser | null;
  stabilityScore: number;
  openQuestionsCount: number;
  pendingSide: "developer" | "requester" | "none";
  confidence: "low" | "medium" | "high";
  recommendationLabel: string;
};

export type SpecBridgeNotification = {
  id: string;
  type: "assigned" | "clarification_waiting";
  issueKey: string;
  title: string;
  message: string;
  createdAt: string;
  href: string;
};

export type SpecBridgeNotificationResponse = {
  viewer: JiraUser;
  count: number;
  items: SpecBridgeNotification[];
};

export type SpecBridgeWorkspace = {
  currentViewer: JiraUser;
  issue: {
    issueKey: string;
    summary: string;
    description: string;
    status: string;
    priority: string;
    issueType: string;
    projectKey: string;
    projectName: string;
    labels: string[];
    components: string[];
    url: string;
    updatedAt: string;
    reporter: JiraUser | null;
    assignee: JiraUser | null;
  };
  ticketIntelligence: {
    requirementStabilityScore: number;
    ambiguityCount: number;
    assignmentReason: string;
    assignmentRisks: string[];
    openQuestionsCount: number;
    unresolvedBlockers: string[];
    lastAISummary: string;
    confidence: "low" | "medium" | "high";
    availableTransitions: JiraTransition[];
    lastAnalyzedAt: string;
    classification: Record<string, string | string[]>;
  };
  clarificationThread: {
    requesterAccountId: string;
    assigneeAccountId: string | null;
    reviewerAccountId: string | null;
    messages: SpecBridgeMessage[];
    openQuestions: SpecBridgeQuestion[];
    resolvedQuestions: SpecBridgeQuestion[];
    pendingSide: "developer" | "requester" | "none";
    aiSummary: string;
    lastResponseAt: string;
    acceptanceCriteriaSuggestions: string[];
    unresolvedBlockers: string[];
  };
  lifecycleEvents: SpecBridgeLifecycleEvent[];
  recommendation: {
    clarifyFirst: boolean;
    confidence: "low" | "medium" | "high";
    topCandidates: SpecBridgeCandidate[];
    missingQuestions: string[];
  };
};
