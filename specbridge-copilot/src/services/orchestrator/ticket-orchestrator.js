const { Queue } = require("@forge/events");
const { addCommentAsApp, assignIssueAsUser, fetchIssueSnapshot, searchSimilarIssues } = require("../../lib/jira-client");
const {
  appendLifecycleEvents,
  getClarificationThread,
  getDeveloperProfiles,
  getTicketIntelligence,
  setClarificationThread,
  setTicketIntelligence,
  upsertDeveloperProfiles
} = require("../../lib/storage");
const { normalizeWhitespace, toIsoNow } = require("../../lib/text");
const { createAssignmentExplanation } = require("../ai/ai-service");
const { addBridgeQuestion, buildClarificationThread, resolveBridgeQuestion } = require("../analysis/clarification-engine");
const { classifyIssue, hydrateProfiles, rankCandidates } = require("../analysis/ranking-engine");
const { computeRequirementStability } = require("../analysis/stability-engine");
const { buildLatestSummary, buildLifecycleEvents } = require("../analysis/watcher-engine");

const queue = new Queue({ key: "specbridge-analysis-queue" });

function resolveIssueKey(context, payload) {
  return context?.extension?.issue?.key || payload?.issueKey || null;
}

function buildTicketIntelligence(issue, stability, ranking, thread, summary) {
  return {
    issueKey: issue.issueKey,
    requirementStabilityScore: stability.score,
    ambiguityCount: stability.ambiguityCount,
    recommendedAssignee: ranking.clarifyFirst ? null : ranking.topCandidate?.accountId || null,
    backupAssignees: ranking.topThree.slice(1).map((candidate) => candidate.accountId),
    assignmentReason: "",
    assignmentRisks: ranking.topCandidate?.risks || stability.blockers,
    matchScores: Object.fromEntries(
      ranking.topThree.map((candidate) => [
        candidate.accountId,
        {
          totalScore: candidate.totalScore,
          breakdown: candidate.breakdown,
          reasons: candidate.reasons
        }
      ])
    ),
    openQuestionsCount: thread.openQuestions.length,
    unresolvedBlockers: thread.unresolvedBlockers,
    clarificationStatus: thread.openQuestions.length ? "open" : "stable",
    lastAISummary: summary,
    lastAnalyzedAt: toIsoNow(),
    confidence: ranking.confidence,
    classification: ranking.classification,
    currentAssignee: issue.assignee?.accountId || null,
    status: issue.status,
    availableTransitions: issue.transitions
  };
}

async function buildWorkspace(issueKey, sourceEvent) {
  const issue = await fetchIssueSnapshot(issueKey);
  const similarIssues = await searchSimilarIssues(issue).catch(() => []);
  const storedProfiles = await getDeveloperProfiles();
  const hydratedProfiles = hydrateProfiles(issue.assignableUsers, storedProfiles, similarIssues);

  if (hydratedProfiles.length && hydratedProfiles.length !== storedProfiles.length) {
    await upsertDeveloperProfiles(hydratedProfiles);
  }

  const existingThread = await getClarificationThread(issueKey);
  const stability = computeRequirementStability(issue, existingThread);
  const classification = classifyIssue(issue);
  const thread = await buildClarificationThread(issue, existingThread);
  const ranking = rankCandidates({
    issue,
    classification,
    profiles: hydratedProfiles,
    similarIssues,
    stability: stability.score
  });

  const previousIntelligence = await getTicketIntelligence(issueKey);
  const summary = await buildLatestSummary(
    issue,
    {
      requirementStabilityScore: stability.score,
      openQuestionsCount: thread.openQuestions.length
    },
    ranking.topCandidate
  );
  const intelligence = buildTicketIntelligence(issue, stability, ranking, thread, summary);
  intelligence.assignmentReason = await createAssignmentExplanation({
    issue,
    topCandidate: ranking.topCandidate,
    confidenceLabel: ranking.confidence,
    clarifyFirst: ranking.clarifyFirst,
    missingQuestions: stability.missingQuestions
  });

  const lifecycleEvents = await buildLifecycleEvents({
    issue,
    previousIntelligence,
    nextIntelligence: intelligence,
    sourceEvent
  });

  await setClarificationThread(issueKey, thread);
  await setTicketIntelligence(issueKey, intelligence);
  const updatedEvents = await appendLifecycleEvents(issueKey, lifecycleEvents);

  return {
    issue,
    developerProfiles: hydratedProfiles,
    ticketIntelligence: intelligence,
    clarificationThread: thread,
    lifecycleEvents: updatedEvents,
    recommendation: {
      clarifyFirst: ranking.clarifyFirst,
      confidence: ranking.confidence,
      topCandidates: ranking.topThree,
      missingQuestions: stability.missingQuestions
    },
    similarIssues
  };
}

async function getIssueWorkspace(payload, context) {
  const issueKey = resolveIssueKey(context, payload);
  if (!issueKey) {
    throw new Error("Issue key was not available in the current Forge context");
  }

  return buildWorkspace(issueKey);
}

async function queueAnalysis(issueKey, metadata = {}) {
  await queue.push({
    body: {
      issueKey,
      metadata
    },
    concurrency: {
      key: issueKey,
      limit: 1
    }
  });

  return { queued: true };
}

async function seedProfiles(payload, context) {
  const workspace = await getIssueWorkspace(payload, context);
  return {
    ok: true,
    profiles: workspace.developerProfiles
  };
}

async function refreshAnalysis(payload, context) {
  return getIssueWorkspace(payload, context);
}

async function acceptRecommendation(payload, context) {
  const issueKey = resolveIssueKey(context, payload);
  const accountId = payload?.accountId;

  if (!issueKey || !accountId) {
    throw new Error("A valid issue and accountId are required");
  }

  await assignIssueAsUser(issueKey, accountId);
  return buildWorkspace(issueKey, {
    eventType: "manual_assign",
    atlassianId: context?.principal?.accountId || null
  });
}

function buildBridgeComment(question) {
  return [
    "[SpecBridge Bridge]",
    `Directed to: ${question.directedTo}`,
    `Original: ${question.text}`,
    question.businessRewrite ? `Business rewrite: ${question.businessRewrite}` : "",
    question.technicalRewrite ? `Technical rewrite: ${question.technicalRewrite}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

async function createClarification(payload, context) {
  const issueKey = resolveIssueKey(context, payload);
  const workspace = await getIssueWorkspace(payload, context);
  const thread = await addBridgeQuestion(workspace.clarificationThread, workspace.issue, {
    text: payload?.text,
    directedTo: payload?.directedTo || "developer",
    authorAccountId: context?.principal?.accountId || "unknown",
    authorDisplayName: payload?.authorDisplayName || "Current user"
  });

  await setClarificationThread(issueKey, thread);
  await addCommentAsApp(issueKey, buildBridgeComment(thread.openQuestions[thread.openQuestions.length - 1]));

  return buildWorkspace(issueKey);
}

async function resolveClarification(payload, context) {
  const issueKey = resolveIssueKey(context, payload);
  const workspace = await getIssueWorkspace(payload, context);
  const thread = await resolveBridgeQuestion(workspace.clarificationThread, workspace.issue, {
    questionId: payload?.questionId,
    resolution: payload?.resolution,
    authorAccountId: context?.principal?.accountId || "unknown",
    authorDisplayName: payload?.authorDisplayName || "Current user"
  });

  await setClarificationThread(issueKey, thread);
  await addCommentAsApp(
    issueKey,
    [
      "[SpecBridge Resolution]",
      `Question: ${payload?.questionText || "Clarification resolved"}`,
      `Resolution: ${normalizeWhitespace(payload?.resolution)}`,
      `Acceptance criteria suggestion: ${
        thread.acceptanceCriteriaSuggestions[thread.acceptanceCriteriaSuggestions.length - 1] || "n/a"
      }`
    ].join("\n")
  );

  return buildWorkspace(issueKey);
}

async function publishSummaryComment(payload, context) {
  const issueKey = resolveIssueKey(context, payload);
  const workspace = await getIssueWorkspace(payload, context);
  await addCommentAsApp(
    issueKey,
    [
      "[SpecBridge AI Summary]",
      workspace.ticketIntelligence.lastAISummary,
      workspace.ticketIntelligence.assignmentReason,
      workspace.clarificationThread.acceptanceCriteriaSuggestions.length
        ? `Acceptance criteria suggestions:\n- ${workspace.clarificationThread.acceptanceCriteriaSuggestions.join("\n- ")}`
        : ""
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  return { ok: true };
}

async function getGlanceStatus(payload) {
  const issueKey = payload?.extension?.issue?.key;
  if (!issueKey) {
    return {
      status: {
        type: "lozenge",
        value: {
          label: "Unloaded",
          type: "default"
        }
      }
    };
  }

  const intelligence = await getTicketIntelligence(issueKey);
  if (!intelligence) {
    return {
      status: {
        type: "lozenge",
        value: {
          label: "Analyzing",
          type: "new"
        }
      }
    };
  }

  if (intelligence.openQuestionsCount > 0) {
    return {
      status: {
        type: "badge",
        value: {
          label: String(intelligence.openQuestionsCount)
        }
      }
    };
  }

  return {
    status: {
      type: "lozenge",
      value: {
        label: intelligence.requirementStabilityScore >= 65 ? "Stable" : "Clarify",
        type: intelligence.requirementStabilityScore >= 65 ? "success" : "inprogress"
      }
    }
  };
}

async function processIssueEvent(event) {
  const issueKey = event?.issue?.key;
  if (!issueKey) {
    return { skipped: true };
  }

  await queueAnalysis(issueKey, {
    eventType: event.eventType,
    atlassianId: event.atlassianId || null,
    changelog: event.changelog || null
  });

  return { queued: true, issueKey };
}

async function processQueueEvent(asyncEvent) {
  const issueKey = asyncEvent?.body?.issueKey;
  if (!issueKey) {
    return { skipped: true };
  }

  return buildWorkspace(issueKey, asyncEvent.body.metadata || null);
}

module.exports = {
  acceptRecommendation,
  createClarification,
  getGlanceStatus,
  getIssueWorkspace,
  processIssueEvent,
  processQueueEvent,
  publishSummaryComment,
  refreshAnalysis,
  resolveClarification,
  seedProfiles
};
