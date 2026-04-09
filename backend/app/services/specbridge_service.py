from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from app.services.ai_service import translate_text
from app.services.jira_service import add_comment, fetch_assignable_users, fetch_current_user, fetch_issue_snapshot, fetch_issues

BRIDGE_MARKER = "[SpecBridge Bridge]"
STABILITY_THRESHOLD = 65

DOMAIN_KEYWORDS = {
    "frontend": ["button", "page", "screen", "layout", "ui", "ux", "widget", "form", "frontend"],
    "api": ["api", "endpoint", "contract", "webhook", "integration", "service", "schema"],
    "data": ["report", "export", "sql", "database", "warehouse", "etl", "data", "dashboard"],
    "auth": ["login", "permission", "oauth", "access", "role", "session", "authentication"],
    "payments": ["payment", "billing", "invoice", "checkout", "pricing", "refund"],
    "platform": ["deploy", "pipeline", "queue", "infrastructure", "config", "ops", "monitoring"],
}

STACK_KEYWORDS = {
    "react": ["react", "next.js", "nextjs", "component", "tailwind", "frontend", "ui"],
    "node": ["node", "express", "typescript", "javascript", "resolver", "forge"],
    "java": ["java", "spring", "kotlin", "jvm"],
    "python": ["python", "fastapi", "django", "data"],
    "cloud": ["aws", "queue", "lambda", "infrastructure", "deploy", "monitoring"],
    "database": ["sql", "postgres", "mysql", "migration", "schema", "query"],
}

QUESTION_WORDS = ["what", "why", "how", "when", "where", "who", "can", "could", "should", "would", "is", "are", "do", "does"]
BLOCKER_WORDS = ["blocked", "blocker", "dependency", "waiting", "cannot", "can't", "stuck"]
VAGUE_PATTERNS = [
    r"\bmaybe\b",
    r"\bsomehow\b",
    r"\betc\b",
    r"\basap\b",
    r"\bquick(?:ly)?\b",
    r"\beasy\b",
    r"\bimprove\b",
    r"\boptimi[sz]e\b",
    r"\bkind of\b",
    r"\bsomething\b",
    r"\bnice to have\b",
]


def _normalize(value: str | None) -> str:
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", str(value or "").replace("\r", ""))).strip()


def _tokenize(text: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9+#.-]+", _normalize(text).lower()) if len(token) > 2]


def _unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = _normalize(value)
        if normalized and normalized not in seen:
            output.append(normalized)
            seen.add(normalized)
    return output


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _keyword_score(text: str, keyword_map: dict[str, list[str]]) -> list[dict[str, Any]]:
    lower = _normalize(text).lower()
    ranked = []
    for key, keywords in keyword_map.items():
        score = sum(1 for keyword in keywords if keyword in lower)
        ranked.append({"key": key, "score": score})
    return sorted(ranked, key=lambda item: item["score"], reverse=True)


def _overlap_score(left: list[str], right: list[str], max_score: int) -> int:
    left_set = {value.lower() for value in left if value}
    right_set = {value.lower() for value in right if value}
    if not left_set or not right_set:
        return 0
    matches = len(left_set.intersection(right_set))
    return min(max_score, round((matches / max(len(left_set), 1)) * max_score))


def _count_pattern_matches(text: str, patterns: list[str]) -> int:
    return sum(len(re.findall(pattern, text, flags=re.IGNORECASE)) for pattern in patterns)


def _extract_question_candidates(text: str) -> list[str]:
    normalized = _normalize(text)
    if not normalized:
        return []

    candidates = []
    for line in re.split(r"\n|(?<=[?!.])", normalized):
        current = line.strip()
        lower = current.lower()
        if current and ("?" in current or any(lower.startswith(f"{word} ") for word in QUESTION_WORDS)):
            candidates.append(current)
    return _unique_strings(candidates)


def _find_blockers(text: str) -> list[str]:
    lower = _normalize(text).lower()
    return [word for word in BLOCKER_WORDS if word in lower]


def _classify_issue(issue: dict[str, Any]) -> dict[str, Any]:
    source = " ".join(
        [
            issue["summary"],
            issue["descriptionText"],
            " ".join(issue["labels"]),
            " ".join(issue["components"]),
        ]
    )
    domains = _keyword_score(source, DOMAIN_KEYWORDS)
    stacks = _keyword_score(source, STACK_KEYWORDS)

    complexity_signals = sum(
        [
            issue["priority"].lower() in {"highest", "critical", "high"},
            len(issue["components"]) > 1,
            len(issue["labels"]) > 2,
            len(issue["descriptionText"]) > 280,
        ]
    )

    likely_skills = _unique_strings(
        [
            domains[0]["key"] if domains and domains[0]["score"] else "platform",
            stacks[0]["key"] if stacks and stacks[0]["score"] else "node",
            *issue["labels"],
            *issue["components"],
            *_tokenize(issue["summary"])[:4],
        ]
    )

    return {
        "domain": domains[0]["key"] if domains and domains[0]["score"] else "platform",
        "stack": stacks[0]["key"] if stacks and stacks[0]["score"] else "node",
        "complexity": "high" if complexity_signals >= 3 else "medium" if complexity_signals == 2 else "low",
        "likelySkills": likely_skills,
    }


def _quoted(values: list[str]) -> str:
    return ", ".join(f'"{value.replace(chr(34), "")}"' for value in values if value)


def _build_similarity_jql(issue: dict[str, Any]) -> str:
    clauses = [f'project = "{issue["project"]["key"]}"', f'key != "{issue["issueKey"]}"']
    signals: list[str] = []

    if issue["labels"]:
        signals.append(f"labels in ({_quoted(issue['labels'][:3])})")
    if issue["components"]:
        signals.append(f"component in ({_quoted(issue['components'][:3])})")

    for token in _tokenize(f'{issue["summary"]} {issue["descriptionText"]}')[:3]:
        signals.append(f'text ~ "\\"{token}\\""')

    if signals:
        clauses.append(f"({' OR '.join(signals)})")

    return " AND ".join(clauses) + " ORDER BY updated DESC"


def _serialize_bridge_comment(metadata: dict[str, Any], text: str) -> str:
    payload = json.dumps(metadata, ensure_ascii=True, separators=(",", ":"))
    return f"{BRIDGE_MARKER}\n{payload}\n---\n{_normalize(text)}"


def _parse_bridge_comment(comment: dict[str, Any]) -> dict[str, Any] | None:
    body = _normalize(comment.get("bodyText"))
    if not body.startswith(BRIDGE_MARKER):
        return None

    rest = body[len(BRIDGE_MARKER) :].lstrip()
    if "\n---\n" not in rest:
        return None

    metadata_blob, message_text = rest.split("\n---\n", 1)
    try:
        metadata = json.loads(metadata_blob.strip())
    except json.JSONDecodeError:
        return None

    return {
        "id": metadata.get("messageId") or comment.get("id") or str(uuid4()),
        "messageType": metadata.get("messageType", "note"),
        "questionId": metadata.get("questionId"),
        "text": _normalize(message_text),
        "authorAccountId": metadata.get("authorAccountId") or (comment.get("author") or {}).get("accountId", ""),
        "authorDisplayName": metadata.get("authorDisplayName") or (comment.get("author") or {}).get("displayName", "Unknown user"),
        "directedTo": metadata.get("directedTo"),
        "businessRewrite": metadata.get("businessRewrite"),
        "technicalRewrite": metadata.get("technicalRewrite"),
        "createdAt": metadata.get("createdAt") or comment.get("createdAt") or _iso_now(),
        "source": "specbridge",
    }


async def _rewrite_message(text: str) -> tuple[str, str]:
    business, technical = await asyncio.gather(
        translate_text(text, "business"),
        translate_text(text, "developer"),
    )
    return business, technical


def _build_plain_comment_message(comment: dict[str, Any], issue: dict[str, Any]) -> dict[str, Any]:
    author = comment.get("author") or {}
    author_account_id = author.get("accountId", "")
    directed_to = None
    if author_account_id and issue.get("reporter") and author_account_id == issue["reporter"].get("accountId"):
        directed_to = "developer"
    elif author_account_id and issue.get("assignee") and author_account_id == issue["assignee"].get("accountId"):
        directed_to = "requester"

    return {
        "id": f'comment-{comment.get("id", str(uuid4()))}',
        "messageType": "comment",
        "questionId": None,
        "text": _normalize(comment.get("bodyText")),
        "authorAccountId": author_account_id,
        "authorDisplayName": author.get("displayName", "Unknown user"),
        "directedTo": directed_to,
        "businessRewrite": None,
        "technicalRewrite": None,
        "createdAt": comment.get("createdAt") or _iso_now(),
        "source": "jira",
    }


def _derive_thread(issue: dict[str, Any]) -> dict[str, Any]:
    structured_messages: list[dict[str, Any]] = []
    plain_messages: list[dict[str, Any]] = []

    ordered_comments = sorted(
        issue["comments"],
        key=lambda item: _parse_dt(item.get("createdAt")) or datetime.min.replace(tzinfo=timezone.utc),
    )

    for comment in ordered_comments:
        parsed = _parse_bridge_comment(comment)
        if parsed:
            structured_messages.append(parsed)
        else:
            plain_messages.append(_build_plain_comment_message(comment, issue))

    messages = sorted(
        [*plain_messages, *structured_messages],
        key=lambda item: _parse_dt(item.get("createdAt")) or datetime.min.replace(tzinfo=timezone.utc),
    )

    resolved_by_question_id: dict[str, dict[str, Any]] = {}
    open_questions: list[dict[str, Any]] = []
    resolved_questions: list[dict[str, Any]] = []
    known_signatures: set[str] = set()

    for message in structured_messages:
        if message["messageType"] == "resolution" and message.get("questionId"):
            resolved_by_question_id[message["questionId"]] = message

    for message in structured_messages:
        if message["messageType"] != "question":
            continue

        question = {
            "id": message.get("questionId") or message["id"],
            "text": message["text"],
            "askedByDisplayName": message["authorDisplayName"],
            "askedAt": message["createdAt"],
            "directedTo": message.get("directedTo") or "developer",
            "businessRewrite": message.get("businessRewrite"),
            "technicalRewrite": message.get("technicalRewrite"),
        }

        signature = _normalize(question["text"]).lower()
        known_signatures.add(signature)
        resolution = resolved_by_question_id.get(question["id"])

        if resolution:
            resolved_questions.append(
                {
                    **question,
                    "resolution": resolution["text"],
                    "resolvedAt": resolution["createdAt"],
                }
            )
        else:
            open_questions.append(question)

    for index, message in enumerate(plain_messages):
        directed_to = message.get("directedTo")
        if not directed_to:
            continue

        for question_text in _extract_question_candidates(message["text"]):
            signature = _normalize(question_text).lower()
            if signature in known_signatures:
                continue

            question = {
                "id": f'{message["id"]}-{index}',
                "text": question_text,
                "askedByDisplayName": message["authorDisplayName"],
                "askedAt": message["createdAt"],
                "directedTo": directed_to,
                "businessRewrite": None,
                "technicalRewrite": None,
            }
            known_signatures.add(signature)

            resolution = next(
                (
                    candidate
                    for candidate in plain_messages
                    if candidate["createdAt"] > message["createdAt"]
                    and candidate["authorAccountId"] != message["authorAccountId"]
                    and candidate["text"]
                ),
                None,
            )

            if resolution:
                resolved_questions.append(
                    {
                        **question,
                        "resolution": resolution["text"],
                        "resolvedAt": resolution["createdAt"],
                    }
                )
            else:
                open_questions.append(question)

    open_questions.sort(key=lambda item: item["askedAt"], reverse=True)
    resolved_questions.sort(key=lambda item: item.get("resolvedAt", item["askedAt"]), reverse=True)

    pending_side = open_questions[0]["directedTo"] if open_questions else "none"
    last_response_at = messages[-1]["createdAt"] if messages else issue["updatedAt"]
    blockers = _unique_strings(
        [
            *[blocker for question in open_questions for blocker in _find_blockers(question["text"])],
            *[blocker for comment in issue["comments"] for blocker in _find_blockers(comment["bodyText"])],
        ]
    )
    acceptance_criteria = _unique_strings(
        [
            f'Done when {_normalize(question["resolution"]).rstrip(".")}.'
            for question in resolved_questions[:5]
            if question.get("resolution")
        ]
    )
    summary = (
        f'Bridge summary for {issue["issueKey"]}: {len(open_questions)} open question(s), '
        f'{len(resolved_questions)} resolved clarification(s), and the thread is currently waiting on '
        f'{"neither side" if pending_side == "none" else pending_side}.'
    )

    return {
        "requesterAccountId": (issue.get("reporter") or {}).get("accountId", ""),
        "assigneeAccountId": (issue.get("assignee") or {}).get("accountId"),
        "reviewerAccountId": None,
        "messages": list(reversed(messages)),
        "openQuestions": open_questions,
        "resolvedQuestions": resolved_questions,
        "pendingSide": pending_side,
        "aiSummary": summary,
        "lastResponseAt": last_response_at,
        "acceptanceCriteriaSuggestions": acceptance_criteria,
        "unresolvedBlockers": blockers,
    }


def _build_missing_questions(issue: dict[str, Any], ambiguity_count: int) -> list[str]:
    questions: list[str] = []
    description = issue["descriptionText"]

    if not description:
        questions.append("What business outcome should this ticket achieve?")
    if not re.search(r"acceptance criteria|done when|success criteria", description, flags=re.IGNORECASE):
        questions.append("What are the acceptance criteria or definition of done?")
    if not issue["components"]:
        questions.append("Which product area or component should own this change?")
    if ambiguity_count > 2:
        questions.append("Which part of the wording needs to be made more precise before assignment?")

    return questions


def _compute_stability(issue: dict[str, Any], thread: dict[str, Any]) -> dict[str, Any]:
    combined_text = _normalize(
        "\n".join([issue["summary"], issue["descriptionText"], *[comment["bodyText"] for comment in issue["comments"]]])
    )
    ambiguity_count = _count_pattern_matches(combined_text, VAGUE_PATTERNS)
    missing_acceptance = not re.search(
        r"acceptance criteria|done when|success criteria",
        issue["descriptionText"],
        flags=re.IGNORECASE,
    )
    description_recently_changed = any(
        any(item.get("field") == "description" for item in history.get("items", []))
        and (_parse_dt(history.get("createdAt")) or datetime.min.replace(tzinfo=timezone.utc))
        >= datetime.now(timezone.utc) - timedelta(days=7)
        for history in issue["changelog"]
    )
    conflicting_comments = sum(
        1 for comment in issue["comments"] if re.search(r"\bbut\b|\bhowever\b|\bconflict\b|\bcontradict\b", comment["bodyText"], flags=re.IGNORECASE)
    )
    blockers = _unique_strings([blocker for comment in issue["comments"] for blocker in _find_blockers(comment["bodyText"])])

    score = 100
    score -= ambiguity_count * 8
    score -= len(thread["openQuestions"]) * 6
    score -= 18 if missing_acceptance else 0
    score -= 14 if not issue["descriptionText"] or len(issue["descriptionText"]) < 40 else 0
    score -= 10 if description_recently_changed else 0
    score -= min(conflicting_comments * 7, 14)
    score -= min(len(blockers) * 5, 10)
    score = max(0, min(100, score))

    return {
        "score": score,
        "ambiguityCount": ambiguity_count,
        "missingQuestions": _build_missing_questions(issue, ambiguity_count),
        "blockers": blockers,
        "clarifyFirst": score < STABILITY_THRESHOLD,
    }


def _build_candidate_context(
    issue: dict[str, Any],
    assignable_users: list[dict[str, Any]],
    similar_issues: list[dict[str, Any]],
    active_project_issues: list[dict[str, Any]],
    done_project_issues: list[dict[str, Any]],
    classification: dict[str, Any],
    stability_score: int,
) -> list[dict[str, Any]]:
    similar_by_user: dict[str, list[dict[str, Any]]] = {}
    active_by_user: dict[str, list[dict[str, Any]]] = {}
    done_by_user: dict[str, list[dict[str, Any]]] = {}

    for collection, bucket in [
        (similar_issues, similar_by_user),
        (active_project_issues, active_by_user),
        (done_project_issues, done_by_user),
    ]:
        for candidate_issue in collection:
            account_id = candidate_issue.get("assignee_account_id")
            if not account_id:
                continue
            bucket.setdefault(account_id, []).append(candidate_issue)

    results = []
    for user in assignable_users:
        account_id = user.get("accountId", "")
        similar_assignments = similar_by_user.get(account_id, [])
        active_assignments = active_by_user.get(account_id, [])
        done_assignments = done_by_user.get(account_id, [])

        candidate_skills = _unique_strings(
            [
                *[label for candidate_issue in similar_assignments + done_assignments for label in candidate_issue.get("labels", [])],
                *[
                    component
                    for candidate_issue in similar_assignments + done_assignments
                    for component in candidate_issue.get("components", [])
                ],
                *[
                    token
                    for candidate_issue in similar_assignments[:5] + done_assignments[:5]
                    for token in _tokenize(candidate_issue.get("summary", ""))[:3]
                ],
            ]
        )
        feature_areas = _unique_strings(
            [component for candidate_issue in similar_assignments + done_assignments for component in candidate_issue.get("components", [])]
        )

        skill_match = _overlap_score(classification["likelySkills"], candidate_skills, 25)
        domain_familiarity = min(15, _overlap_score([classification["domain"], *issue["components"]], feature_areas, 10) + min(len(similar_assignments) * 2, 5))
        ownership_familiarity = min(10, len(similar_assignments) * 3)
        workload_score = max(0, 15 - min(len(active_assignments) * 3, 15))
        quality_score = min(15, len(done_assignments) * 2 + len([candidate_issue for candidate_issue in similar_assignments if candidate_issue.get("status_category") == "done"]))
        current_issue_comments = sum(
            1 for comment in issue["comments"] if (comment.get("author") or {}).get("accountId") == account_id
        )
        collaboration_score = min(10, len(similar_assignments) * 2 + current_issue_comments)
        risk_penalty = min(
            15,
            (5 if stability_score < STABILITY_THRESHOLD else 0)
            + (4 if not similar_assignments else 0)
            + min(len(active_assignments), 4),
        )

        total_score = max(
            0,
            min(
                100,
                skill_match
                + domain_familiarity
                + ownership_familiarity
                + workload_score
                + quality_score
                + collaboration_score
                - risk_penalty,
            ),
        )

        reasons = _unique_strings(
            [
                f'{user.get("displayName", "This developer")} matches the strongest issue skill signals' if skill_match else "",
                f'has ownership history across {len(similar_assignments)} similar Jira issue(s)' if similar_assignments else "",
                f'currently carries {len(active_assignments)} active project issue(s)' if active_assignments else "currently has open capacity in this project",
                f'has {len(done_assignments)} recently completed project issue(s)' if done_assignments else "",
                "current Jira comments show direct analyst-developer collaboration" if current_issue_comments else "",
                "repo ownership is approximated from similar-ticket ownership because repository metadata is not connected yet",
            ]
        )
        risks = _unique_strings(
            [
                "requirement stability is still low, so assignment confidence is capped" if stability_score < STABILITY_THRESHOLD else "",
                "no similar Jira ownership was found for this exact area yet" if not similar_assignments else "",
                "current workload is elevated" if len(active_assignments) >= 4 else "",
            ]
        )

        results.append(
            {
                "accountId": account_id,
                "displayName": user.get("displayName", "Unknown user"),
                "role": "Assignable Jira user",
                "totalScore": total_score,
                "profileSource": "jira",
                "isAssignable": True,
                "reasons": reasons,
                "risks": risks,
                "breakdown": {
                    "skillMatch": skill_match,
                    "domainFamiliarity": domain_familiarity,
                    "ownershipFamiliarity": ownership_familiarity,
                    "workloadScore": workload_score,
                    "qualityScore": quality_score,
                    "collaborationScore": collaboration_score,
                    "riskPenalty": risk_penalty,
                },
                "recentTickets": _unique_strings([candidate_issue["key"] for candidate_issue in similar_assignments + done_assignments])[:5],
            }
        )

    return sorted(results, key=lambda item: item["totalScore"], reverse=True)


def _build_assignment_explanation(
    issue: dict[str, Any],
    top_candidate: dict[str, Any] | None,
    confidence: str,
    clarify_first: bool,
    missing_questions: list[str],
) -> str:
    if clarify_first:
        suffix = f' Missing questions: {" | ".join(missing_questions)}.' if missing_questions else ""
        return f'Requirements are still unstable for {issue["issueKey"]}, so SpecBridge recommends clarifying before assignment.{suffix}'
    if not top_candidate:
        return f'No reliable Jira assignee recommendation is available yet for {issue["issueKey"]}.'
    reasons = "; ".join(top_candidate["reasons"][:3])
    return (
        f'{top_candidate["displayName"]} is the strongest live Jira match for {issue["issueKey"]} with {confidence} confidence because '
        f"{reasons}."
    )


def _build_latest_summary(issue: dict[str, Any], stability: dict[str, Any], thread: dict[str, Any], top_candidate: dict[str, Any] | None) -> str:
    candidate_text = (
        f'Best assignee signal: {top_candidate["displayName"]} ({top_candidate["totalScore"]}/100).'
        if top_candidate
        else "No assignee recommendation is being pushed yet."
    )
    return (
        f'{issue["issueKey"]} is in {issue["status"]}. Stability is {stability["score"]}/100 with '
        f'{len(thread["openQuestions"])} open question(s). {candidate_text}'
    )


def _issue_list_to_workspace_shape(issue: dict[str, Any], comments: list[dict[str, Any]]) -> dict[str, Any]:
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
        "reporter": {
            "accountId": issue.get("reporter_account_id", ""),
            "displayName": issue.get("reporter", "") or "Unknown user",
        },
        "assignee": (
            {
                "accountId": issue.get("assignee_account_id", ""),
                "displayName": issue.get("assignee", "") or "Unknown user",
            }
            if issue.get("assignee")
            else None
        ),
        "createdAt": issue["created"],
        "updatedAt": issue["updated"],
        "url": issue["url"],
        "comments": comments,
        "transitions": [],
        "assignableUsers": [],
        "changelog": [],
    }


def _build_inbox_item(issue: dict[str, Any]) -> dict[str, Any]:
    issue_shape = _issue_list_to_workspace_shape(issue, [])
    thread = _derive_thread(issue_shape)
    stability = _compute_stability(issue_shape, thread)

    if issue.get("assignee"):
        recommendation_label = issue["assignee"]
    elif stability["clarifyFirst"]:
        recommendation_label = "Clarify first"
    else:
        recommendation_label = "Open in details"

    return {
        "issueKey": issue["key"],
        "summary": issue["summary"],
        "status": issue["status"],
        "priority": issue["priority"],
        "updatedAt": issue["updated"],
        "url": issue["url"],
        "reporter": {
            "accountId": issue.get("reporter_account_id", ""),
            "displayName": issue.get("reporter", "") or "Unknown user",
            "active": True,
        },
        "assignee": (
            {
                "accountId": issue.get("assignee_account_id", ""),
                "displayName": issue.get("assignee", "") or "Unknown user",
                "active": True,
            }
            if issue.get("assignee")
            else None
        ),
        "stabilityScore": stability["score"],
        "openQuestionsCount": len(thread["openQuestions"]),
        "pendingSide": thread["pendingSide"],
        "confidence": "medium" if stability["score"] >= STABILITY_THRESHOLD else "low",
        "recommendationLabel": recommendation_label,
    }


def _build_lifecycle_events(
    issue: dict[str, Any],
    thread: dict[str, Any],
    stability: dict[str, Any],
    top_candidate: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    events = [
        {
            "eventType": "created",
            "timestamp": issue["createdAt"] or _iso_now(),
            "aiInterpretation": f'Lifecycle update for {issue["issueKey"]}: created. Stability is {stability["score"]}/100.',
        },
        {
            "eventType": "analyzed",
            "timestamp": _iso_now(),
            "aiInterpretation": f'Lifecycle update for {issue["issueKey"]}: analyzed. Stability is {stability["score"]}/100.',
        },
    ]

    if top_candidate:
        events.append(
            {
                "eventType": "recommended_assignee",
                "timestamp": _iso_now(),
                "aiInterpretation": (
                    f'Lifecycle update for {issue["issueKey"]}: recommended assignee {top_candidate["displayName"]}. '
                    f'Stability is {stability["score"]}/100.'
                ),
            }
        )

    latest_assignee_change = None
    for history in issue["changelog"]:
        for item in history.get("items", []):
            if item.get("field") == "assignee":
                latest_assignee_change = {
                    "eventType": "assigned",
                    "timestamp": history.get("createdAt") or _iso_now(),
                    "aiInterpretation": (
                        f'Lifecycle update for {issue["issueKey"]}: assignee changed from '
                        f'{item.get("fromString") or "Unassigned"} to {item.get("toString") or "Unassigned"}.'
                    ),
                }

    if issue.get("assignee") and not latest_assignee_change:
        latest_assignee_change = {
            "eventType": "assigned",
            "timestamp": issue["updatedAt"] or _iso_now(),
            "aiInterpretation": (
                f'Lifecycle update for {issue["issueKey"]}: currently assigned to {issue["assignee"].get("displayName", "Unknown user")}.'
            ),
        }

    if latest_assignee_change:
        events.append(latest_assignee_change)

    if thread["openQuestions"]:
        events.append(
            {
                "eventType": "clarification_requested",
                "timestamp": thread["openQuestions"][0]["askedAt"],
                "aiInterpretation": (
                    f'Lifecycle update for {issue["issueKey"]}: clarification requested. '
                    f'{len(thread["openQuestions"])} open question(s) remain.'
                ),
            }
        )

    if thread["resolvedQuestions"]:
        events.append(
            {
                "eventType": "clarified",
                "timestamp": thread["resolvedQuestions"][0].get("resolvedAt", thread["resolvedQuestions"][0]["askedAt"]),
                "aiInterpretation": (
                    f'Lifecycle update for {issue["issueKey"]}: clarification answered. '
                    f'{len(thread["resolvedQuestions"])} clarification(s) have been resolved.'
                ),
            }
        )

    for history in issue["changelog"]:
        for item in history.get("items", []):
            if item.get("field") != "status":
                continue
            new_status = item.get("toString") or issue["status"]
            events.append(
                {
                    "eventType": "status_changed",
                    "timestamp": history.get("createdAt") or _iso_now(),
                    "aiInterpretation": (
                        f'Lifecycle update for {issue["issueKey"]}: status changed from '
                        f'{item.get("fromString") or "Unknown"} to {new_status}.'
                    ),
                }
            )

    lower_status = issue["status"].lower()
    for event_type, active in [
        ("review_started", "review" in lower_status),
        ("changes_requested", "change requested" in lower_status or "rework" in lower_status),
        ("approved", "approved" in lower_status),
        ("done", any(term in lower_status for term in ["done", "closed", "resolved"])),
    ]:
        if active:
            events.append(
                {
                    "eventType": event_type,
                    "timestamp": issue["updatedAt"] or _iso_now(),
                    "aiInterpretation": f'Lifecycle update for {issue["issueKey"]}: {event_type.replace("_", " ")}.',
                }
            )

    deduped: dict[tuple[str, str], dict[str, Any]] = {}
    for event in events:
        deduped[(event["eventType"], event["timestamp"])] = event

    return sorted(deduped.values(), key=lambda item: item["timestamp"], reverse=True)


def _similarity_score(issue: dict[str, Any], candidate: dict[str, Any]) -> int:
    issue_terms = set(_tokenize(f'{issue["summary"]} {issue["descriptionText"]}')[:8])
    candidate_terms = set(_tokenize(f'{candidate["summary"]} {candidate["description"]}')[:8])
    label_overlap = len(set(issue["labels"]).intersection(set(candidate.get("labels", []))))
    component_overlap = len(set(issue["components"]).intersection(set(candidate.get("components", []))))
    term_overlap = len(issue_terms.intersection(candidate_terms))
    return (label_overlap * 4) + (component_overlap * 3) + term_overlap


async def _load_issue_context(issue_key: str) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    issue = await fetch_issue_snapshot(issue_key)
    project_key = issue["project"]["key"]

    project_issues = await fetch_issues(
        jql=f'project = "{project_key}" ORDER BY updated DESC',
        max_results=100,
    )
    related_issues = [candidate for candidate in project_issues if candidate["key"] != issue_key]
    active_issues = [candidate for candidate in related_issues if candidate.get("status_category", "").lower() != "done"]
    done_issues = [candidate for candidate in related_issues if candidate.get("status_category", "").lower() == "done"]
    similar_issues = sorted(
        related_issues,
        key=lambda candidate: _similarity_score(issue, candidate),
        reverse=True,
    )[:30]
    return issue, similar_issues, active_issues, done_issues


async def get_specbridge_workspace(issue_key: str) -> dict[str, Any]:
    issue, similar_issues, active_issues, done_issues = await _load_issue_context(issue_key)
    classification = _classify_issue(issue)
    thread = _derive_thread(issue)
    stability = _compute_stability(issue, thread)
    assignable_users = issue["assignableUsers"] or await fetch_assignable_users(issue_key, max_results=50)
    ranked_candidates = _build_candidate_context(
        issue,
        assignable_users,
        similar_issues,
        active_issues,
        done_issues,
        classification,
        stability["score"],
    )
    top_candidates = ranked_candidates[:3]
    top_candidate = top_candidates[0] if top_candidates else None
    score_gap = top_candidates[0]["totalScore"] - top_candidates[1]["totalScore"] if len(top_candidates) > 1 else top_candidates[0]["totalScore"] if top_candidates else 0

    confidence = "low"
    if stability["score"] >= 80 and top_candidate and top_candidate["totalScore"] >= 75 and score_gap >= 10:
        confidence = "high"
    elif stability["score"] >= 65 and top_candidate and top_candidate["totalScore"] >= 60 and score_gap >= 5:
        confidence = "medium"

    clarify_first = stability["clarifyFirst"] or not top_candidate or top_candidate["totalScore"] < 55
    assignment_reason = _build_assignment_explanation(issue, top_candidate, confidence, clarify_first, stability["missingQuestions"])
    latest_summary = _build_latest_summary(issue, stability, thread, top_candidate)
    lifecycle_events = _build_lifecycle_events(issue, thread, stability, top_candidate)

    return {
        "currentViewer": await fetch_current_user(),
        "issue": {
            "issueKey": issue["issueKey"],
            "summary": issue["summary"],
            "description": issue["descriptionText"],
            "status": issue["status"],
            "priority": issue["priority"],
            "issueType": issue["issueType"],
            "projectKey": issue["project"]["key"],
            "projectName": issue["project"]["name"],
            "labels": issue["labels"],
            "components": issue["components"],
            "url": issue["url"],
            "updatedAt": issue["updatedAt"],
            "reporter": issue.get("reporter"),
            "assignee": issue.get("assignee"),
        },
        "ticketIntelligence": {
            "requirementStabilityScore": stability["score"],
            "ambiguityCount": stability["ambiguityCount"],
            "assignmentReason": assignment_reason,
            "assignmentRisks": top_candidate["risks"] if top_candidate else stability["blockers"],
            "openQuestionsCount": len(thread["openQuestions"]),
            "unresolvedBlockers": thread["unresolvedBlockers"],
            "lastAISummary": latest_summary,
            "confidence": confidence,
            "availableTransitions": issue["transitions"],
            "lastAnalyzedAt": _iso_now(),
            "classification": classification,
        },
        "clarificationThread": thread,
        "lifecycleEvents": lifecycle_events,
        "recommendation": {
            "clarifyFirst": clarify_first,
            "confidence": confidence,
            "topCandidates": top_candidates,
            "missingQuestions": stability["missingQuestions"],
        },
    }


async def list_specbridge_inbox(project_key: str | None = None, jql: str | None = None, max_results: int = 10) -> list[dict[str, Any]]:
    issues = await fetch_issues(project_key=project_key, jql=jql, max_results=max_results)
    inbox = [_build_inbox_item(issue) for issue in issues[:max_results]]
    return sorted(inbox, key=lambda item: item["updatedAt"], reverse=True)


async def list_specbridge_notifications(max_results: int = 8) -> dict[str, Any]:
    viewer = await fetch_current_user()
    assigned_issues = await fetch_issues(
        jql="assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC",
        max_results=max_results,
    )
    workspaces = await asyncio.gather(*[get_specbridge_workspace(issue["key"]) for issue in assigned_issues[:max_results]])

    notifications = []
    for workspace in workspaces:
        issue = workspace["issue"]
        thread = workspace["clarificationThread"]
        lifecycle = workspace["lifecycleEvents"]
        assigned_event = next((event for event in lifecycle if event["eventType"] == "assigned"), None)
        assigned_recently = assigned_event and (
            (_parse_dt(assigned_event["timestamp"]) or datetime.min.replace(tzinfo=timezone.utc))
            >= datetime.now(timezone.utc) - timedelta(days=3)
        )

        if assigned_event and assigned_recently:
            notifications.append(
                {
                    "id": f'assigned-{issue["issueKey"]}',
                    "type": "assigned",
                    "issueKey": issue["issueKey"],
                    "title": f'Assigned to you: {issue["summary"]}',
                    "message": f'{issue["issueKey"]} is assigned to the connected Jira user and is now visible in SpecBridge.',
                    "createdAt": assigned_event["timestamp"],
                    "href": f'/specbridge?issue={issue["issueKey"]}',
                }
            )

        if thread["pendingSide"] == "developer" and thread["openQuestions"]:
            notifications.append(
                {
                    "id": f'waiting-{issue["issueKey"]}',
                    "type": "clarification_waiting",
                    "issueKey": issue["issueKey"],
                    "title": f'Waiting on developer: {issue["summary"]}',
                    "message": thread["openQuestions"][0]["text"],
                    "createdAt": thread["openQuestions"][0]["askedAt"],
                    "href": f'/specbridge?issue={issue["issueKey"]}',
                }
            )

    notifications.sort(key=lambda item: item["createdAt"], reverse=True)
    return {"viewer": viewer, "count": len(notifications[:max_results]), "items": notifications[:max_results]}


async def create_bridge_message(
    issue_key: str,
    *,
    text: str,
    directed_to: str,
    message_type: str = "question",
    question_id: str | None = None,
) -> dict[str, Any]:
    viewer = await fetch_current_user()
    business_rewrite, technical_rewrite = await _rewrite_message(text)
    metadata = {
        "messageId": str(uuid4()),
        "messageType": message_type,
        "questionId": question_id or str(uuid4()),
        "authorAccountId": viewer.get("accountId", ""),
        "authorDisplayName": viewer.get("displayName", "Connected Jira user"),
        "directedTo": directed_to,
        "businessRewrite": business_rewrite,
        "technicalRewrite": technical_rewrite,
        "createdAt": _iso_now(),
    }

    await add_comment(issue_key, _serialize_bridge_comment(metadata, text))
    return await get_specbridge_workspace(issue_key)
