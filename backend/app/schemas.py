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
