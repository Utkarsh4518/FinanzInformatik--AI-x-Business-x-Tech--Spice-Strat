"""Manus AI API client -- creates tasks and polls for results."""
from __future__ import annotations

import asyncio
import logging
import os

import httpx

logger = logging.getLogger("bridge.manus")

MANUS_API = "https://api.manus.ai"
_manus_key = os.getenv("MANUS_API_KEY", "")


def _has_manus() -> bool:
    return bool(_manus_key or os.getenv("MANUS_API_KEY", ""))


def _headers() -> dict[str, str]:
    key = os.getenv("MANUS_API_KEY", _manus_key)
    return {
        "x-manus-api-key": key,
        "Content-Type": "application/json",
    }


async def call_manus(prompt: str, max_wait: int = 120) -> str | None:
    """Submit a prompt to Manus (manus-1.6-max) and poll until completion.

    Returns the assistant's text response, or None on failure/timeout.
    """
    if not _has_manus():
        return None

    async with httpx.AsyncClient(timeout=30) as client:
        # 1) Create task
        try:
            resp = await client.post(
                f"{MANUS_API}/v2/task.create",
                headers=_headers(),
                json={
                    "message": {"content": prompt},
                    "agent_profile": "manus-1.6-max",
                    "hide_in_task_list": True,
                    "interactive_mode": False,
                },
            )
            data = resp.json()
            if not data.get("ok"):
                logger.warning("Manus task.create failed: %s", data.get("error", {}).get("message", "unknown"))
                return None
            task_id = data["task_id"]
            logger.info("Manus task created: %s", task_id)
        except Exception as exc:
            logger.error("Manus task.create error: %s", str(exc)[:200])
            return None

        # 2) Poll for completion
        elapsed = 0
        interval = 3
        while elapsed < max_wait:
            await asyncio.sleep(interval)
            elapsed += interval

            try:
                poll = await client.get(
                    f"{MANUS_API}/v2/task.listMessages",
                    headers=_headers(),
                    params={"task_id": task_id, "order": "desc", "limit": 20},
                )
                poll_data = poll.json()
                if not poll_data.get("ok"):
                    logger.warning("Manus poll error: %s", poll_data)
                    continue

                messages = poll_data.get("messages", [])

                for msg in messages:
                    msg_type = msg.get("type")

                    if msg_type == "status_update":
                        status = msg.get("status_update", {}).get("agent_status")
                        if status == "stopped":
                            # Find the assistant_message
                            for m2 in messages:
                                if m2.get("type") == "assistant_message":
                                    content = m2.get("assistant_message", {}).get("content", "")
                                    if content:
                                        logger.info("Manus task %s completed (%ds)", task_id, elapsed)
                                        return content
                            logger.warning("Manus task stopped but no assistant_message found")
                            return None

                        if status == "error":
                            for m2 in messages:
                                if m2.get("type") == "error_message":
                                    logger.error("Manus error: %s", m2.get("error_message", {}).get("content", ""))
                            return None

                # Increase poll interval progressively
                if elapsed > 30:
                    interval = 5
                if elapsed > 60:
                    interval = 8

            except Exception as exc:
                logger.warning("Manus poll exception: %s", str(exc)[:150])

        logger.warning("Manus task %s timed out after %ds", task_id, max_wait)
        return None
