from dotenv import load_dotenv

load_dotenv()

import os

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.schemas import (
    AiGenerateTicketRequest,
    ChatRequest,
    ChatResponse,
    CommitDetail,
    CommitFile,
    CommitSummary,
    ExplainCommitRequest,
    ExplainCommitResponse,
    JiraCreateRequest,
    JiraCreateResponse,
    JiraIssue,
    JiraProject,
    LanguageTranslateRequest,
    LanguageTranslateResponse,
    RepoDetail,
    RepoSummary,
    TranslateRequest,
    TranslateResponse,
)
from app.services.ai_service import chat_response, explain_commit, generate_ticket_content, translate_language, translate_text
from app.services.github_service import fetch_commit_detail, fetch_commits, fetch_repo_detail, fetch_repos
from app.services.jira_service import (
    create_issue as jira_create_issue,
    fetch_issue_detail as jira_fetch_issue,
    fetch_issues as jira_fetch_issues,
    fetch_projects as jira_fetch_projects,
)

app = FastAPI(
    title="Biz x Tech API",
    version="0.2.0",
    summary="Backend for the Biz x Tech Business-Tech collaboration tool.",
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


# ── GitHub Commits ───────────────────────────────────────────────────

@app.get("/github/commits", response_model=list[CommitSummary])
async def list_commits(
    owner: str = Query(..., min_length=1),
    repo: str = Query(..., min_length=1),
    count: int = Query(7, ge=1, le=30),
):
    try:
        raw = await fetch_commits(owner, repo, count)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}") from exc
    return [CommitSummary(**c) for c in raw]


@app.get("/github/commits/{owner}/{repo}/{sha}", response_model=CommitDetail)
async def get_commit(owner: str, repo: str, sha: str):
    try:
        data = await fetch_commit_detail(owner, repo, sha)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {exc}") from exc
    return CommitDetail(
        sha=data["sha"],
        message=data["message"],
        author_name=data["author_name"],
        author_avatar_url=data["author_avatar_url"],
        date=data["date"],
        url=data["url"],
        additions=data["additions"],
        deletions=data["deletions"],
        file_count=data["file_count"],
        files=[CommitFile(**f) for f in data["files"]],
    )


@app.post("/ai/explain-commit", response_model=ExplainCommitResponse)
async def ai_explain_commit(payload: ExplainCommitRequest):
    try:
        data = await fetch_commit_detail(payload.owner, payload.repo, payload.sha)
        explanation = await explain_commit(
            data["message"],
            data["files"],
            payload.mode,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error: {exc}") from exc
    return ExplainCommitResponse(explanation=explanation, mode=payload.mode)


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


# ── Language Translation (EN <-> DE) ─────────────────────────────────

@app.post("/ai/translate-language", response_model=LanguageTranslateResponse)
async def translate_lang(payload: LanguageTranslateRequest):
    try:
        translated, rewritten = await translate_language(
            payload.text,
            payload.source_language,
            payload.target_language,
            payload.audience,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Translation error: {exc}") from exc

    return LanguageTranslateResponse(
        original_text=payload.text,
        translated_text=translated,
        rewritten_text=rewritten,
        source_language=payload.source_language,
        target_language=payload.target_language,
    )


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


# ── Text-to-Speech (ElevenLabs) ─────────────────────────────────────

_ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
_ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # "Adam" professional voice


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


@app.post("/tts")
async def text_to_speech(payload: TTSRequest):
    api_key = _ELEVENLABS_API_KEY or os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{_ELEVENLABS_VOICE_ID}/stream"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    body = {
        "text": payload.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async def stream_audio():
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream("POST", url, headers=headers, json=body) as resp:
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail="ElevenLabs API error")
                async for chunk in resp.aiter_bytes(4096):
                    yield chunk

    return StreamingResponse(stream_audio(), media_type="audio/mpeg")
