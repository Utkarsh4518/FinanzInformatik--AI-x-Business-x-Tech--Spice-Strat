from __future__ import annotations

import logging
import os
from base64 import b64encode

import httpx

logger = logging.getLogger("bridge.jira")

_domain = os.getenv("JIRA_DOMAIN", "")
_email = os.getenv("JIRA_EMAIL", "")
_token = os.getenv("JIRA_API_TOKEN", "")


def _base_url() -> str:
    domain = _domain or os.getenv("JIRA_DOMAIN", "")
    return f"https://{domain}"


def _headers() -> dict[str, str]:
    email = _email or os.getenv("JIRA_EMAIL", "")
    token = _token or os.getenv("JIRA_API_TOKEN", "")
    creds = b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {creds}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _simplify_issue(raw: dict) -> dict:
    fields = raw.get("fields", {})
    assignee = fields.get("assignee") or {}
    reporter = fields.get("reporter") or {}
    status = fields.get("status") or {}
    priority = fields.get("priority") or {}
    issuetype = fields.get("issuetype") or {}
    project = fields.get("project") or {}

    description = ""
    desc_field = fields.get("description")
    if isinstance(desc_field, str):
        description = desc_field
    elif isinstance(desc_field, dict):
        description = _extract_adf_text(desc_field)

    return {
        "key": raw.get("key", ""),
        "summary": fields.get("summary", ""),
        "description": description,
        "status": status.get("name", ""),
        "status_category": (status.get("statusCategory") or {}).get("key", ""),
        "priority": priority.get("name", ""),
        "issue_type": issuetype.get("name", ""),
        "assignee": assignee.get("displayName", ""),
        "reporter": reporter.get("displayName", ""),
        "project_key": project.get("key", ""),
        "project_name": project.get("name", ""),
        "created": fields.get("created", ""),
        "updated": fields.get("updated", ""),
        "labels": fields.get("labels", []),
        "url": f"{_base_url()}/browse/{raw.get('key', '')}",
    }


def _extract_adf_text(adf: dict) -> str:
    """Recursively extract plain text from Atlassian Document Format."""
    parts: list[str] = []
    for node in adf.get("content", []):
        if node.get("type") == "text":
            parts.append(node.get("text", ""))
        elif "content" in node:
            parts.append(_extract_adf_text(node))
    return " ".join(parts).strip()


import re

def _inline_marks(text: str) -> list[dict]:
    """Convert inline markdown (bold, italic, code) to ADF text nodes with marks."""
    nodes: list[dict] = []
    pattern = re.compile(
        r"(\*\*\*(.+?)\*\*\*)"    # bold+italic
        r"|(\*\*(.+?)\*\*)"       # bold
        r"|(__(.+?)__)"           # bold (underscores)
        r"|(\*(.+?)\*)"           # italic
        r"|(_(.+?)_)"             # italic (underscores)
        r"|(`(.+?)`)"             # inline code
    )
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            nodes.append({"type": "text", "text": text[pos:m.start()]})

        if m.group(2):  # bold+italic
            nodes.append({"type": "text", "text": m.group(2), "marks": [{"type": "strong"}, {"type": "em"}]})
        elif m.group(4):  # bold **
            nodes.append({"type": "text", "text": m.group(4), "marks": [{"type": "strong"}]})
        elif m.group(6):  # bold __
            nodes.append({"type": "text", "text": m.group(6), "marks": [{"type": "strong"}]})
        elif m.group(8):  # italic *
            nodes.append({"type": "text", "text": m.group(8), "marks": [{"type": "em"}]})
        elif m.group(10):  # italic _
            nodes.append({"type": "text", "text": m.group(10), "marks": [{"type": "em"}]})
        elif m.group(12):  # code
            nodes.append({"type": "text", "text": m.group(12), "marks": [{"type": "code"}]})
        pos = m.end()

    if pos < len(text):
        nodes.append({"type": "text", "text": text[pos:]})

    return nodes if nodes else [{"type": "text", "text": text}]


def _markdown_to_adf(md: str) -> dict:
    """Convert common markdown to Atlassian Document Format (ADF).

    Handles: headings (#-###), bullet lists (- / *), numbered lists (1.),
    horizontal rules (---), bold, italic, inline code, and paragraphs.
    """
    doc: dict = {"type": "doc", "version": 1, "content": []}
    lines = md.split("\n")
    i = 0

    def _flush_list(items: list[list[dict]], ordered: bool) -> dict:
        list_type = "orderedList" if ordered else "bulletList"
        return {
            "type": list_type,
            "content": [
                {
                    "type": "listItem",
                    "content": [{"type": "paragraph", "content": inline}],
                }
                for inline in items
            ],
        }

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped.startswith("---") and all(c in "-" for c in stripped):
            doc["content"].append({"type": "rule"})
            i += 1
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading_match:
            level = min(len(heading_match.group(1)), 6)
            doc["content"].append({
                "type": "heading",
                "attrs": {"level": level},
                "content": _inline_marks(heading_match.group(2).strip()),
            })
            i += 1
            continue

        bullet_match = re.match(r"^[-*]\s+(.+)$", stripped)
        if bullet_match:
            items: list[list[dict]] = []
            while i < len(lines):
                bm = re.match(r"^[-*]\s+(.+)$", lines[i].strip())
                if not bm:
                    break
                items.append(_inline_marks(bm.group(1)))
                i += 1
            doc["content"].append(_flush_list(items, ordered=False))
            continue

        ol_match = re.match(r"^\d+[.)]\s+(.+)$", stripped)
        if ol_match:
            items = []
            while i < len(lines):
                om = re.match(r"^\d+[.)]\s+(.+)$", lines[i].strip())
                if not om:
                    break
                items.append(_inline_marks(om.group(1)))
                i += 1
            doc["content"].append(_flush_list(items, ordered=True))
            continue

        doc["content"].append({
            "type": "paragraph",
            "content": _inline_marks(stripped),
        })
        i += 1

    if not doc["content"]:
        doc["content"].append({
            "type": "paragraph",
            "content": [{"type": "text", "text": md or "(empty)"}],
        })

    return doc


_auth_cache: bool | None = None


async def _is_authenticated() -> bool:
    global _auth_cache
    if _auth_cache is not None:
        return _auth_cache
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(f"{_base_url()}/rest/api/3/myself", headers=_headers())
            _auth_cache = resp.status_code == 200
            if _auth_cache:
                logger.info("Jira auth OK")
            else:
                logger.warning("Jira auth failed: %s", resp.status_code)
            return _auth_cache
    except Exception as exc:
        logger.warning("Jira auth check error: %s", exc)
        _auth_cache = False
        return False


_created_issues: list[dict] = []


async def fetch_projects() -> list[dict]:
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{_base_url()}/rest/api/3/project",
                headers=_headers(),
            )
            resp.raise_for_status()
            for p in resp.json():
                results.append({
                    "key": p.get("key", ""),
                    "name": p.get("name", ""),
                    "project_type": p.get("projectTypeKey", ""),
                    "style": p.get("style", ""),
                    "url": f"{_base_url()}/browse/{p.get('key', '')}",
                })
    except Exception as exc:
        logger.warning("Jira project fetch failed: %s", exc)

    return results


async def fetch_issues(project_key: str | None = None, jql: str | None = None, max_results: int = 30) -> list[dict]:
    real_issues: list[dict] = []

    if project_key or jql:
        query = jql if jql else f"project = {project_key} ORDER BY updated DESC"
        try:
            if await _is_authenticated():
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(
                        f"{_base_url()}/rest/api/3/search/jql",
                        headers=_headers(),
                        params={
                            "jql": query,
                            "maxResults": max_results,
                            "fields": "summary,status,priority,issuetype,assignee,reporter,project,created,updated,labels,description",
                        },
                    )
                    resp.raise_for_status()
                    real_issues = [_simplify_issue(i) for i in resp.json().get("issues", [])]
        except Exception as exc:
            logger.warning("Jira search failed: %s", exc)

    demo_pool = _created_issues
    if project_key:
        demo_pool = [i for i in demo_pool if i["project_key"] == project_key]

    real_keys = {i["key"] for i in real_issues}
    merged = real_issues + [d for d in demo_pool if d["key"] not in real_keys]
    return merged[:max_results]


async def fetch_issue_detail(issue_key: str) -> dict:
    try:
        if await _is_authenticated():
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{_base_url()}/rest/api/3/issue/{issue_key}",
                    headers=_headers(),
                )
                resp.raise_for_status()
                return _simplify_issue(resp.json())
    except Exception:
        pass

    all_demo = _created_issues
    for i in all_demo:
        if i["key"] == issue_key:
            return i
    return {
        "key": issue_key, "summary": "Issue not found", "description": "",
        "status": "", "status_category": "", "priority": "", "issue_type": "",
        "assignee": "", "reporter": "", "project_key": "", "project_name": "",
        "created": "", "updated": "", "labels": [], "url": "",
    }


async def create_issue(project_key: str, summary: str, description: str, issue_type: str = "Task") -> dict:
    try:
        if await _is_authenticated():
            body = {
                "fields": {
                    "project": {"key": project_key},
                    "summary": summary,
                    "description": _markdown_to_adf(description),
                    "issuetype": {"name": issue_type},
                }
            }

            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{_base_url()}/rest/api/3/issue",
                    headers=_headers(),
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()
                key = data.get("key", "")
                logger.info("Created real Jira issue: %s", key)
                return {
                    "key": key,
                    "url": f"{_base_url()}/browse/{key}",
                    "id": data.get("id", ""),
                }
    except Exception as exc:
        logger.warning("Jira create failed, storing locally: %s", exc)

    counter = len(_created_issues) + 101
    new_key = f"{project_key}-{counter}"
    new_issue = {
        "key": new_key, "summary": summary, "description": description,
        "status": "To Do", "status_category": "new", "priority": "Medium",
        "issue_type": issue_type, "assignee": "", "reporter": "Utkarsh Maurya",
        "project_key": project_key, "project_name": project_key,
        "created": "2026-04-09T12:00:00.000+0000", "updated": "2026-04-09T12:00:00.000+0000",
        "labels": ["ai-generated"], "url": "",
    }
    _created_issues.append(new_issue)
    return {"key": new_key, "url": "", "id": str(counter)}
