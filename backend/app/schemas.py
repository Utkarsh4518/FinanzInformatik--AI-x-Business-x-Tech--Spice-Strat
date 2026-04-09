from pydantic import BaseModel, Field


class RepoSummary(BaseModel):
    name: str
    full_name: str
    description: str | None = None
    html_url: str
    language: str | None = None
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    updated_at: str | None = None
    topics: list[str] = Field(default_factory=list)
    fork: bool = False


class RepoDetail(BaseModel):
    name: str
    full_name: str
    description: str | None = None
    html_url: str
    language: str | None = None
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    updated_at: str | None = None
    created_at: str | None = None
    topics: list[str] = Field(default_factory=list)
    readme: str | None = None
    languages: dict[str, int] = Field(default_factory=dict)
    default_branch: str = "main"


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_audience: str = Field(..., pattern="^(business|developer)$")
    context: str | None = None


class TranslateResponse(BaseModel):
    translated: str
    target_audience: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    mode: str = Field(..., pattern="^(business|developer)$")
    context: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    mode: str


class JiraProject(BaseModel):
    key: str
    name: str
    project_type: str = ""
    style: str = ""
    url: str = ""


class JiraIssue(BaseModel):
    key: str
    summary: str
    description: str = ""
    status: str = ""
    status_category: str = ""
    priority: str = ""
    issue_type: str = ""
    assignee: str = ""
    reporter: str = ""
    project_key: str = ""
    project_name: str = ""
    created: str = ""
    updated: str = ""
    labels: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    assignee_account_id: str = ""
    reporter_account_id: str = ""
    url: str = ""


class JiraCreateRequest(BaseModel):
    project_key: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1)
    description: str = ""
    issue_type: str = "Task"


class JiraCreateResponse(BaseModel):
    key: str
    url: str
    id: str = ""


class AiGenerateTicketRequest(BaseModel):
    requirement: str = Field(..., min_length=1)
    project_key: str = Field(..., min_length=1)
    mode: str = Field(..., pattern="^(business|developer)$")
    context: str | None = None


class LanguageTranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_language: str = "en"
    target_language: str = "de"
    audience: str | None = None


class LanguageTranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    rewritten_text: str
    source_language: str
    target_language: str


class JiraUser(BaseModel):
    accountId: str = ""
    displayName: str = ""
    emailAddress: str | None = None
    avatarUrl: str | None = None
    active: bool = True


class JiraTransition(BaseModel):
    id: str
    name: str = ""
    toStatus: str = ""


class SpecBridgeMessage(BaseModel):
    id: str
    messageType: str
    text: str
    authorAccountId: str = ""
    authorDisplayName: str = ""
    directedTo: str | None = None
    businessRewrite: str | None = None
    technicalRewrite: str | None = None
    createdAt: str
    source: str = "jira"
    questionId: str | None = None


class SpecBridgeQuestion(BaseModel):
    id: str
    text: str
    askedByDisplayName: str
    askedAt: str
    directedTo: str
    businessRewrite: str | None = None
    technicalRewrite: str | None = None
    resolution: str | None = None
    resolvedAt: str | None = None


class SpecBridgeLifecycleEvent(BaseModel):
    eventType: str
    timestamp: str
    aiInterpretation: str


class SpecBridgeCandidate(BaseModel):
    accountId: str
    displayName: str
    role: str = ""
    totalScore: int
    profileSource: str
    isAssignable: bool = True
    reasons: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    recentTickets: list[str] = Field(default_factory=list)
    breakdown: dict[str, int] = Field(default_factory=dict)


class SpecBridgeInboxItem(BaseModel):
    issueKey: str
    summary: str
    status: str
    priority: str = ""
    updatedAt: str = ""
    url: str = ""
    reporter: JiraUser | None = None
    assignee: JiraUser | None = None
    stabilityScore: int
    openQuestionsCount: int
    pendingSide: str
    confidence: str
    recommendationLabel: str


class SpecBridgeNotification(BaseModel):
    id: str
    type: str
    issueKey: str
    title: str
    message: str
    createdAt: str
    href: str


class SpecBridgeNotificationResponse(BaseModel):
    viewer: JiraUser
    count: int
    items: list[SpecBridgeNotification] = Field(default_factory=list)


class SpecBridgeWorkspaceIssue(BaseModel):
    issueKey: str
    summary: str
    description: str = ""
    status: str
    priority: str = ""
    issueType: str = ""
    projectKey: str = ""
    projectName: str = ""
    labels: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    url: str = ""
    updatedAt: str = ""
    reporter: JiraUser | None = None
    assignee: JiraUser | None = None


class SpecBridgeTicketIntelligence(BaseModel):
    requirementStabilityScore: int
    ambiguityCount: int
    assignmentReason: str
    assignmentRisks: list[str] = Field(default_factory=list)
    openQuestionsCount: int
    unresolvedBlockers: list[str] = Field(default_factory=list)
    lastAISummary: str
    confidence: str
    availableTransitions: list[JiraTransition] = Field(default_factory=list)
    lastAnalyzedAt: str = ""
    classification: dict[str, str | list[str]] = Field(default_factory=dict)


class SpecBridgeClarificationThread(BaseModel):
    requesterAccountId: str = ""
    assigneeAccountId: str | None = None
    reviewerAccountId: str | None = None
    messages: list[SpecBridgeMessage] = Field(default_factory=list)
    openQuestions: list[SpecBridgeQuestion] = Field(default_factory=list)
    resolvedQuestions: list[SpecBridgeQuestion] = Field(default_factory=list)
    pendingSide: str
    aiSummary: str
    lastResponseAt: str = ""
    acceptanceCriteriaSuggestions: list[str] = Field(default_factory=list)
    unresolvedBlockers: list[str] = Field(default_factory=list)


class SpecBridgeRecommendation(BaseModel):
    clarifyFirst: bool
    confidence: str
    topCandidates: list[SpecBridgeCandidate] = Field(default_factory=list)
    missingQuestions: list[str] = Field(default_factory=list)


class SpecBridgeWorkspace(BaseModel):
    currentViewer: JiraUser
    issue: SpecBridgeWorkspaceIssue
    ticketIntelligence: SpecBridgeTicketIntelligence
    clarificationThread: SpecBridgeClarificationThread
    lifecycleEvents: list[SpecBridgeLifecycleEvent] = Field(default_factory=list)
    recommendation: SpecBridgeRecommendation


class SpecBridgeMessageRequest(BaseModel):
    text: str = Field(..., min_length=1)
    directedTo: str = Field(..., pattern="^(developer|requester)$")
    messageType: str = Field("question", pattern="^(question|note|resolution)$")
    questionId: str | None = None
