from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from base64 import b64encode
from typing import Any

import httpx

logger = logging.getLogger("bridge.jira")

_ISSUE_FIELDS = [
    "summary",
    "description",
    "status",
    "priority",
    "issuetype",
    "assignee",
    "reporter",
    "project",
    "created",
    "updated",
    "labels",
    "components",
]


def _base_url() -> str:
    domain = os.getenv("JIRA_DOMAIN", "").strip()
    if not domain:
        raise RuntimeError("JIRA_DOMAIN is not configured")
    if domain.startswith("http://") or domain.startswith("https://"):
        return domain.rstrip("/")
    return f"https://{domain.rstrip('/')}"


def build_issue_url(issue_key: str) -> str:
    return f"{_base_url()}/browse/{issue_key}"


def _headers() -> dict[str, str]:
    email = os.getenv("JIRA_EMAIL", "").strip()
    token = os.getenv("JIRA_API_TOKEN", "").strip()
    if not email or not token:
        raise RuntimeError("JIRA_EMAIL and JIRA_API_TOKEN must be configured")

    creds = b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {creds}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def normalize_whitespace(value: str | None) -> str:
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", str(value or "").replace("\r", ""))).strip()


def _join_chunks(chunks: list[str]) -> str:
    return normalize_whitespace("".join(chunks))


def extract_adf_text(node: Any) -> str:
    chunks: list[str] = []

    def walk(current: Any) -> None:
        if current is None:
            return

        if isinstance(current, str):
            chunks.append(current)
            return

        if isinstance(current, list):
            for child in current:
                walk(child)
            return

        if not isinstance(current, dict):
            return

        node_type = current.get("type")

        if node_type == "text":
            chunks.append(current.get("text", ""))
            return

        if node_type == "hardBreak":
            chunks.append("\n")
            return

        for child in current.get("content", []):
            walk(child)

        if node_type in {"paragraph", "heading", "listItem", "blockquote", "codeBlock"}:
            chunks.append("\n")

    walk(node)
    return _join_chunks(chunks)


def build_adf_document(text: str) -> dict[str, Any]:
    normalized = normalize_whitespace(text)
    paragraphs = []

    for paragraph in re.split(r"\n{2,}", normalized):
        lines = [line.strip() for line in paragraph.split("\n") if line.strip()]
        if not lines:
            continue

        content: list[dict[str, Any]] = []
        for index, line in enumerate(lines):
            if index:
                content.append({"type": "hardBreak"})
            content.append({"type": "text", "text": line})

        paragraphs.append({"type": "paragraph", "content": content})

    if not paragraphs:
        paragraphs = [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]

    return {"type": "doc", "version": 1, "content": paragraphs}


def _map_user(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None

    return {
        "accountId": raw.get("accountId", ""),
        "displayName": raw.get("displayName", "") or raw.get("emailAddress", "") or "Unknown user",
        "emailAddress": raw.get("emailAddress"),
        "avatarUrl": (raw.get("avatarUrls") or {}).get("48x48")
        or (raw.get("avatarUrls") or {}).get("24x24")
        or (raw.get("avatarUrls") or {}).get("16x16"),
        "active": raw.get("active", True),
    }


async def _request_json(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    timeout: float = 20,
) -> Any:
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.request(
            method,
            f"{_base_url()}{path}",
            headers=_headers(),
            params=params,
            json=json_body,
        )

    if response.status_code == 204:
        return None

    if response.status_code >= 400:
        detail = response.text[:400]
        raise RuntimeError(f"Jira API {response.status_code}: {detail}")

    return response.json()


def _simplify_issue(raw: dict[str, Any]) -> dict[str, Any]:
    fields = raw.get("fields", {})
    assignee = fields.get("assignee") or {}
    reporter = fields.get("reporter") or {}
    status = fields.get("status") or {}
    priority = fields.get("priority") or {}
    issue_type = fields.get("issuetype") or {}
    project = fields.get("project") or {}
    components = fields.get("components") or []

    description = ""
    desc_field = fields.get("description")
    if isinstance(desc_field, str):
        description = normalize_whitespace(desc_field)
    elif isinstance(desc_field, dict):
        description = extract_adf_text(desc_field)

    return {
        "key": raw.get("key", ""),
        "summary": fields.get("summary", ""),
        "description": description,
        "status": status.get("name", ""),
        "status_category": (status.get("statusCategory") or {}).get("key", ""),
        "priority": priority.get("name", ""),
        "issue_type": issue_type.get("name", ""),
        "assignee": assignee.get("displayName", ""),
        "assignee_account_id": assignee.get("accountId", ""),
        "reporter": reporter.get("displayName", ""),
        "reporter_account_id": reporter.get("accountId", ""),
        "project_key": project.get("key", ""),
        "project_name": project.get("name", ""),
        "created": fields.get("created", ""),
        "updated": fields.get("updated", ""),
        "labels": fields.get("labels", []) or [],
        "components": [component.get("name", "") for component in components if component.get("name")],
        "url": build_issue_url(raw.get("key", "")),
    }


async def fetch_current_user() -> dict[str, Any]:
    user = await _request_json("GET", "/rest/api/3/myself")
    return _map_user(user) or {"accountId": "", "displayName": "Unknown user", "active": True}


async def fetch_projects() -> list[dict[str, Any]]:
    response = await _request_json(
        "GET",
        "/rest/api/3/project/search",
        params={"maxResults": 100},
    )

    projects = response.get("values") if isinstance(response, dict) else response
    return [
        {
            "key": project.get("key", ""),
            "name": project.get("name", ""),
            "project_type": project.get("projectTypeKey", ""),
            "style": project.get("style", ""),
            "url": build_issue_url(project.get("key", "")),
        }
        for project in projects or []
    ]


async def search_issues(
    jql: str,
    *,
    max_results: int = 30,
    fields: list[str] | None = None,
    expand: list[str] | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {
        "jql": jql,
        "maxResults": max_results,
        "fields": ",".join(fields or _ISSUE_FIELDS),
    }
    if expand:
        params["expand"] = ",".join(expand)

    response = await _request_json("GET", "/rest/api/3/search/jql", params=params)
    return response.get("issues", []) or []


async def fetch_issues(
    project_key: str | None = None,
    jql: str | None = None,
    max_results: int = 30,
) -> list[dict[str, Any]]:
    query = jql or (
        f'project = "{project_key}" ORDER BY updated DESC'
        if project_key
        else "assignee = currentUser() OR reporter = currentUser() ORDER BY updated DESC"
    )
    issues = await search_issues(query, max_results=max_results)
    return [_simplify_issue(issue) for issue in issues]


async def fetch_issue_detail(issue_key: str) -> dict[str, Any]:
    issue = await _request_json(
        "GET",
        f"/rest/api/3/issue/{issue_key}",
        params={"fields": ",".join(_ISSUE_FIELDS)},
    )
    return _simplify_issue(issue)


async def fetch_issue_comments(issue_key: str, max_results: int = 100) -> list[dict[str, Any]]:
    response = await _request_json(
        "GET",
        f"/rest/api/3/issue/{issue_key}/comment",
        params={"startAt": 0, "maxResults": max_results, "orderBy": "-created"},
    )

    comments = []
    for comment in response.get("comments", []) or []:
        comments.append(
            {
                "id": comment.get("id", ""),
                "author": _map_user(comment.get("author")),
                "bodyText": extract_adf_text(comment.get("body")),
                "createdAt": comment.get("created", ""),
                "updatedAt": comment.get("updated", ""),
            }
        )

    return comments


async def fetch_issue_transitions(issue_key: str) -> list[dict[str, Any]]:
    response = await _request_json("GET", f"/rest/api/3/issue/{issue_key}/transitions")
    return [
        {
            "id": transition.get("id", ""),
            "name": transition.get("name", ""),
            "toStatus": (transition.get("to") or {}).get("name", transition.get("name", "")),
        }
        for transition in response.get("transitions", []) or []
    ]


async def fetch_assignable_users(
    issue_key: str,
    *,
    query: str = "",
    max_results: int = 25,
) -> list[dict[str, Any]]:
    users = await _request_json(
        "GET",
        "/rest/api/3/user/assignable/search",
        params={"issueKey": issue_key, "query": query, "maxResults": max_results},
    )
    return [_map_user(user) for user in users or [] if _map_user(user)]


async def fetch_issue_snapshot(issue_key: str) -> dict[str, Any]:
    issue_response, comments, transitions, assignable_users = await asyncio.gather(
        _request_json(
            "GET",
            f"/rest/api/3/issue/{issue_key}",
            params={"fields": ",".join(_ISSUE_FIELDS), "expand": "changelog"},
        ),
        fetch_issue_comments(issue_key),
        fetch_issue_transitions(issue_key),
        fetch_assignable_users(issue_key, max_results=50),
    )

    fields = issue_response.get("fields", {})
    issue = _simplify_issue(issue_response)

    return {
        "issueKey": issue["key"],
        "summary": issue["summary"],
        "descriptionText": issue["description"],
        "status": issue["status"],
        "statusCategory": issue["status_category"],
        "priority": issue["priority"] or "Medium",
        "issueType": issue["issue_type"] or "Task",
        "labels": issue["labels"],
        "components": issue["components"],
        "project": {
            "key": issue["project_key"],
            "name": issue["project_name"],
        },
        "reporter": _map_user(fields.get("reporter")),
        "assignee": _map_user(fields.get("assignee")),
        "createdAt": issue["created"],
        "updatedAt": issue["updated"],
        "url": issue["url"],
        "comments": comments,
        "transitions": transitions,
        "assignableUsers": assignable_users,
        "changelog": [
            {
                "id": history.get("id", ""),
                "author": _map_user(history.get("author")),
                "createdAt": history.get("created", ""),
                "items": [
                    {
                        "field": item.get("field", ""),
                        "fieldId": item.get("fieldId", ""),
                        "from": item.get("from"),
                        "fromString": item.get("fromString"),
                        "to": item.get("to"),
                        "toString": item.get("toString"),
                    }
                    for item in history.get("items", []) or []
                ],
            }
            for history in (issue_response.get("changelog") or {}).get("histories", []) or []
        ],
    }


async def add_comment(issue_key: str, text: str) -> dict[str, Any]:
    response = await _request_json(
        "POST",
        f"/rest/api/3/issue/{issue_key}/comment",
        json_body={"body": build_adf_document(text)},
    )
    return {
        "id": response.get("id", ""),
        "author": _map_user(response.get("author")),
        "bodyText": extract_adf_text(response.get("body")),
        "createdAt": response.get("created", ""),
        "updatedAt": response.get("updated", ""),
    }


async def create_issue(project_key: str, summary: str, description: str, issue_type: str = "Task") -> dict[str, Any]:
    body = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "description": build_adf_document(description),
            "issuetype": {"name": issue_type},
        }
    }

    data = await _request_json("POST", "/rest/api/3/issue", json_body=body)
    key = data.get("key", "")
    return {"key": key, "url": build_issue_url(key), "id": data.get("id", "")}
