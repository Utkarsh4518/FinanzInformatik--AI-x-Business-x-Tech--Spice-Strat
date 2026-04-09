from __future__ import annotations

import os
from base64 import b64decode

import httpx

GITHUB_API = "https://api.github.com"
_token = os.getenv("GITHUB_TOKEN", "")


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
        try:
            readme_resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                headers=_headers(),
            )
            if readme_resp.status_code == 200:
                content = readme_resp.json().get("content", "")
                readme_text = b64decode(content).decode("utf-8", errors="replace")
        except Exception:
            pass

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
