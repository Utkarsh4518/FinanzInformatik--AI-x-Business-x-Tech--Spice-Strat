const { createLatestSummary, summarizeLifecycle } = require("../ai/ai-service");
const { toIsoNow, uniqueStrings } = require("../../lib/text");

function deriveStatusEvents(issue) {
  const lower = issue.status.toLowerCase();
  const events = [];

  if (lower.includes("review")) {
    events.push("review_started");
  }

  if (lower.includes("change requested") || lower.includes("rework")) {
    events.push("changes_requested");
  }

  if (lower.includes("approved")) {
    events.push("approved");
  }

  if (lower.includes("done") || lower.includes("closed") || lower.includes("resolved")) {
    events.push("done");
  }

  return events;
}

async function buildLifecycleEvents({ issue, previousIntelligence, nextIntelligence, sourceEvent }) {
  const now = toIsoNow();
  const events = [];

  if (!previousIntelligence) {
    events.push({
      issueKey: issue.issueKey,
      eventType: "created",
      actor: issue.reporter?.displayName || "System",
      oldValue: null,
      newValue: issue.status,
      timestamp: issue.createdAt || now
    });
  }

  events.push({
    issueKey: issue.issueKey,
    eventType: "analyzed",
    actor: "SpecBridge Copilot",
    oldValue: previousIntelligence?.lastAnalyzedAt || null,
    newValue: nextIntelligence.lastAnalyzedAt,
    timestamp: now
  });

  if (nextIntelligence.recommendedAssignee && nextIntelligence.recommendedAssignee !== previousIntelligence?.recommendedAssignee) {
    events.push({
      issueKey: issue.issueKey,
      eventType: "recommended_assignee",
      actor: "SpecBridge Copilot",
      oldValue: previousIntelligence?.recommendedAssignee || null,
      newValue: nextIntelligence.recommendedAssignee,
      timestamp: now
    });
  }

  if (issue.assignee?.accountId && issue.assignee?.accountId !== previousIntelligence?.currentAssignee) {
    events.push({
      issueKey: issue.issueKey,
      eventType: "assigned",
      actor: sourceEvent?.atlassianId || issue.assignee.displayName || "System",
      oldValue: previousIntelligence?.currentAssignee || null,
      newValue: issue.assignee.accountId,
      timestamp: now
    });
  }

  if ((previousIntelligence?.openQuestionsCount || 0) === 0 && nextIntelligence.openQuestionsCount > 0) {
    events.push({
      issueKey: issue.issueKey,
      eventType: "clarification_requested",
      actor: "SpecBridge Copilot",
      oldValue: "0",
      newValue: String(nextIntelligence.openQuestionsCount),
      timestamp: now
    });
  }

  if ((previousIntelligence?.openQuestionsCount || 0) > 0 && nextIntelligence.openQuestionsCount === 0) {
    events.push({
      issueKey: issue.issueKey,
      eventType: "clarified",
      actor: "SpecBridge Copilot",
      oldValue: String(previousIntelligence.openQuestionsCount),
      newValue: "0",
      timestamp: now
    });
  }

  if (sourceEvent?.eventType === "avi:jira:updated:issue") {
    const statusChange = (sourceEvent.changelog?.items || []).find((item) => item.field === "status");
    if (statusChange) {
      events.push({
        issueKey: issue.issueKey,
        eventType: "status_changed",
        actor: sourceEvent.atlassianId || "System",
        oldValue: statusChange.fromString || null,
        newValue: statusChange.toString || issue.status,
        timestamp: now
      });
    }
  }

  for (const eventType of deriveStatusEvents(issue)) {
    events.push({
      issueKey: issue.issueKey,
      eventType,
      actor: "SpecBridge Copilot",
      oldValue: previousIntelligence?.status || null,
      newValue: issue.status,
      timestamp: now
    });
  }

  const enriched = [];
  for (const event of events) {
    enriched.push({
      ...event,
      aiInterpretation: await summarizeLifecycle({
        issue,
        eventType: event.eventType,
        blockerCount: nextIntelligence.unresolvedBlockers.length,
        stabilityScore: nextIntelligence.requirementStabilityScore
      })
    });
  }

  return uniqueStrings(enriched.map((event) => JSON.stringify(event))).map((event) => JSON.parse(event));
}

async function buildLatestSummary(issue, intelligence, topCandidate) {
  return createLatestSummary({
    issue,
    intelligence,
    topCandidate
  });
}

module.exports = {
  buildLatestSummary,
  buildLifecycleEvents
};
