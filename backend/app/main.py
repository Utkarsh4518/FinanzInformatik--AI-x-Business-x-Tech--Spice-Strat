from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    AiGenerateTicketRequest,
    ChatRequest,
    ChatResponse,
    JiraCreateRequest,
    JiraCreateResponse,
    JiraIssue,
    JiraProject,
    RepoDetail,
    RepoSummary,
    TranslateRequest,
    TranslateResponse,
)
from app.services.ai_service import chat_response, generate_ticket_content, translate_text
from app.services.github_service import fetch_repo_detail, fetch_repos
from app.services.jira_service import (
    create_issue as jira_create_issue,
    fetch_issue_detail as jira_fetch_issue,
    fetch_issues as jira_fetch_issues,
    fetch_projects as jira_fetch_projects,
)

app = FastAPI(
    title="Bridge API",
    version="0.2.0",
    summary="Backend for the Bridge Business-Tech collaboration tool.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/github/repos", response_model=list[RepoSummary])
async def list_repos(owner: str = Query(..., min_length=1)):
    try:
        raw = await fetch_repos(owner)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}") from exc

    return [
        RepoSummary(
            name=r.get("name", ""),
            full_name=r.get("full_name", ""),
            description=r.get("description"),
            html_url=r.get("html_url", ""),
            language=r.get("language"),
            stargazers_count=r.get("stargazers_count", 0),
            forks_count=r.get("forks_count", 0),
            open_issues_count=r.get("open_issues_count", 0),
            updated_at=r.get("updated_at"),
            topics=r.get("topics", []),
            fork=r.get("fork", False),
        )
        for r in raw
    ]


@app.get("/github/repos/{owner}/{repo}", response_model=RepoDetail)
async def get_repo(owner: str, repo: str):
    try:
        data = await fetch_repo_detail(owner, repo)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}") from exc

    return RepoDetail(
        name=data.get("name", ""),
        full_name=data.get("full_name", ""),
        description=data.get("description"),
        html_url=data.get("html_url", ""),
        language=data.get("language"),
        stargazers_count=data.get("stargazers_count", 0),
        forks_count=data.get("forks_count", 0),
        open_issues_count=data.get("open_issues_count", 0),
        updated_at=data.get("updated_at"),
        created_at=data.get("created_at"),
        topics=data.get("topics", []),
        readme=data.get("readme"),
        languages=data.get("languages", {}),
        default_branch=data.get("default_branch", "main"),
    )


@app.post("/ai/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    try:
        translated = await translate_text(
            payload.text,
            payload.target_audience,
            payload.context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    return TranslateResponse(
        translated=translated,
        target_audience=payload.target_audience,
    )


@app.post("/ai/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    try:
        reply = await chat_response(
            payload.message,
            payload.mode,
            payload.context,
            payload.history,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    return ChatResponse(reply=reply, mode=payload.mode)


# ── Jira endpoints ──────────────────────────────────────────────────

@app.get("/jira/projects", response_model=list[JiraProject])
async def list_jira_projects():
    try:
        return await jira_fetch_projects()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Jira API error: {exc}") from exc


@app.get("/jira/issues", response_model=list[JiraIssue])
async def list_jira_issues(
    project_key: str | None = Query(None),
    jql: str | None = Query(None),
    max_results: int = Query(30, ge=1, le=100),
):
    try:
        return await jira_fetch_issues(project_key, jql, max_results)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Jira API error: {exc}") from exc


@app.get("/jira/issues/{issue_key}", response_model=JiraIssue)
async def get_jira_issue(issue_key: str):
    try:
        return await jira_fetch_issue(issue_key)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Jira API error: {exc}") from exc


@app.post("/jira/issues", response_model=JiraCreateResponse)
async def create_jira_issue(payload: JiraCreateRequest):
    try:
        return await jira_create_issue(
            payload.project_key,
            payload.summary,
            payload.description,
            payload.issue_type,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Jira API error: {exc}") from exc


@app.post("/ai/generate-ticket", response_model=JiraCreateResponse)
async def ai_generate_ticket(payload: AiGenerateTicketRequest):
    try:
        summary, description = await generate_ticket_content(
            payload.requirement,
            payload.mode,
            payload.context,
        )
        return await jira_create_issue(
            payload.project_key,
            summary,
            description,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error: {exc}") from exc
