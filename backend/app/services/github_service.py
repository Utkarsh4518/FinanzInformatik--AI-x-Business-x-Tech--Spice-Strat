from __future__ import annotations

import html
import logging
import os
from base64 import b64decode

import httpx

GITHUB_API = "https://api.github.com"
_token = os.getenv("GITHUB_TOKEN", "")
logger = logging.getLogger("bridge.github")


def _readme_plain_to_minimal_html(text: str) -> str:
    """Wrap raw README text as safe HTML when GitHub HTML rendering is unavailable."""
    escaped = html.escape(text[:100_000])
    return f'<article class="readme-fallback"><pre style="white-space:pre-wrap;">{escaped}</pre></article>'


def _headers() -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    token = _token or os.getenv("GITHUB_TOKEN", "")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


async def _get_authenticated_user(client: httpx.AsyncClient) -> str | None:
    """Return the login of the token owner, or None if no valid token."""
    token = _token or os.getenv("GITHUB_TOKEN", "")
    if not token:
        return None
    try:
        resp = await client.get(f"{GITHUB_API}/user", headers=_headers())
        if resp.status_code == 200:
            return resp.json().get("login")
    except Exception:
        pass
    return None


async def fetch_repos(owner: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        auth_user = await _get_authenticated_user(client)

        if auth_user and auth_user.lower() == owner.lower():
            resp = await client.get(
                f"{GITHUB_API}/user/repos",
                headers=_headers(),
                params={"sort": "updated", "per_page": 100, "affiliation": "owner"},
            )
            resp.raise_for_status()
            return resp.json()

        resp = await client.get(
            f"{GITHUB_API}/users/{owner}/repos",
            headers=_headers(),
            params={"sort": "updated", "per_page": 30},
        )
        if resp.status_code == 404:
            resp = await client.get(
                f"{GITHUB_API}/orgs/{owner}/repos",
                headers=_headers(),
                params={"sort": "updated", "per_page": 30},
            )
        resp.raise_for_status()
        return resp.json()


async def fetch_repo_detail(owner: str, repo: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        repo_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers=_headers(),
        )
        repo_resp.raise_for_status()
        data = repo_resp.json()

        readme_text: str | None = None

        async def _fetch_readme_raw() -> str | None:
            raw_resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                headers=_headers(),
            )
            if raw_resp.status_code != 200:
                return None
            content = raw_resp.json().get("content", "")
            raw = b64decode(content).decode("utf-8", errors="replace")
            return _readme_plain_to_minimal_html(raw)

        try:
            html_headers = {**_headers(), "Accept": "application/vnd.github.html+json"}
            readme_resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                headers=html_headers,
            )
            if readme_resp.status_code == 200:
                readme_text = readme_resp.text
            elif readme_resp.status_code == 404:
                readme_text = None
            else:
                logger.warning(
                    "README HTML returned %s for %s/%s; using raw README",
                    readme_resp.status_code,
                    owner,
                    repo,
                )
                readme_text = await _fetch_readme_raw()
        except Exception as exc:
            logger.warning("README HTML fetch failed for %s/%s: %s; trying raw", owner, repo, str(exc)[:120])
            try:
                readme_text = await _fetch_readme_raw()
            except Exception as exc2:
                logger.warning("README raw fetch also failed: %s", str(exc2)[:120])

        languages: dict[str, int] = {}
        try:
            lang_resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/languages",
                headers=_headers(),
            )
            if lang_resp.status_code == 200:
                languages = lang_resp.json()
        except Exception:
            pass

        data["readme"] = readme_text
        data["languages"] = languages
        return data
