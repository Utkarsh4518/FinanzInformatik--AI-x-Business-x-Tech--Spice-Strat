const { extractQuestionCandidates, findBlockers, normalizeWhitespace, toIsoNow, uniqueStrings } = require("../../lib/text");
const { rewriteForAudience, summarizeClarificationThread } = require("../ai/ai-service");

function normalizeQuestionSignature(text) {
  return normalizeWhitespace(text).toLowerCase();
}

async function buildClarificationThread(issue, existingThread) {
  const now = toIsoNow();
  const knownQuestions = new Set(
    [...(existingThread?.openQuestions || []), ...(existingThread?.resolvedQuestions || [])].map((question) =>
      normalizeQuestionSignature(question.text)
    )
  );

  const commentQuestions = issue.comments.flatMap((comment) =>
    extractQuestionCandidates(comment.bodyText).map((question) => ({
      id: `comment-${comment.id}-${normalizeQuestionSignature(question).slice(0, 24)}`,
      text: question,
      askedByAccountId: comment.author?.accountId || "unknown",
      askedByDisplayName: comment.author?.displayName || "Unknown",
      askedAt: comment.createdAt,
      source: "jira-comment",
      directedTo:
        comment.author?.accountId && issue.reporter?.accountId && comment.author.accountId === issue.reporter.accountId
          ? "developer"
          : "requester",
      businessRewrite: null,
      technicalRewrite: null
    }))
  );

  const freshQuestions = [];
  for (const question of commentQuestions) {
    const signature = normalizeQuestionSignature(question.text);
    if (!knownQuestions.has(signature)) {
      const businessVersion = await rewriteForAudience(question.text, "business");
      const technicalVersion = await rewriteForAudience(question.text, "technical");
      freshQuestions.push({
        ...question,
        businessRewrite: businessVersion.rewritten,
        technicalRewrite: technicalVersion.rewritten
      });
      knownQuestions.add(signature);
    }
  }

  const openQuestions = [...(existingThread?.openQuestions || []), ...freshQuestions].sort(
    (left, right) => new Date(left.askedAt).getTime() - new Date(right.askedAt).getTime()
  );
  const resolvedQuestions = existingThread?.resolvedQuestions || [];
  const unresolvedBlockers = uniqueStrings(
    openQuestions.flatMap((question) => findBlockers(question.text)).concat(issue.comments.flatMap((comment) => findBlockers(comment.bodyText)))
  );
  const pendingSide = openQuestions[0]?.directedTo || "none";

  const thread = {
    issueKey: issue.issueKey,
    requesterAccountId: existingThread?.requesterAccountId || issue.reporter?.accountId || null,
    assigneeAccountId: issue.assignee?.accountId || existingThread?.assigneeAccountId || null,
    reviewerAccountId: existingThread?.reviewerAccountId || null,
    openQuestions,
    resolvedQuestions,
    pendingSide,
    aiSummary: existingThread?.aiSummary || "",
    lastResponseAt: issue.comments[issue.comments.length - 1]?.updatedAt || existingThread?.lastResponseAt || now,
    acceptanceCriteriaSuggestions: uniqueStrings(
      resolvedQuestions.map((question) => question.acceptanceCriteriaSuggestion).filter(Boolean)
    ),
    unresolvedBlockers,
    createdAt: existingThread?.createdAt || now,
    updatedAt: now
  };

  thread.aiSummary = await summarizeClarificationThread({ issue, thread });
  return thread;
}

async function addBridgeQuestion(thread, issue, payload) {
  const now = toIsoNow();
  const businessVersion = await rewriteForAudience(payload.text, "business");
  const technicalVersion = await rewriteForAudience(payload.text, "technical");

  const nextQuestion = {
    id: `bridge-${Date.now()}`,
    text: normalizeWhitespace(payload.text),
    askedByAccountId: payload.authorAccountId,
    askedByDisplayName: payload.authorDisplayName,
    askedAt: now,
    source: "specbridge",
    directedTo: payload.directedTo,
    businessRewrite: businessVersion.rewritten,
    technicalRewrite: technicalVersion.rewritten
  };

  const nextThread = {
    ...thread,
    requesterAccountId: thread.requesterAccountId || issue.reporter?.accountId || null,
    assigneeAccountId: issue.assignee?.accountId || thread.assigneeAccountId || null,
    openQuestions: [...thread.openQuestions, nextQuestion],
    pendingSide: payload.directedTo,
    lastResponseAt: now,
    updatedAt: now
  };

  nextThread.aiSummary = await summarizeClarificationThread({ issue, thread: nextThread });
  return nextThread;
}

async function resolveBridgeQuestion(thread, issue, payload) {
  const target = thread.openQuestions.find((question) => question.id === payload.questionId);
  if (!target) {
    throw new Error("Question not found");
  }

  const now = toIsoNow();
  const remainingQuestions = thread.openQuestions.filter((question) => question.id !== payload.questionId);
  const businessVersion = await rewriteForAudience(payload.resolution, "business");
  const technicalVersion = await rewriteForAudience(payload.resolution, "technical");

  const resolvedQuestion = {
    ...target,
    resolution: normalizeWhitespace(payload.resolution),
    resolutionByAccountId: payload.authorAccountId,
    resolutionByDisplayName: payload.authorDisplayName,
    resolvedAt: now,
    businessResolution: businessVersion.rewritten,
    technicalResolution: technicalVersion.rewritten,
    acceptanceCriteriaSuggestion: `Done when ${technicalVersion.rewritten || payload.resolution}`
  };

  const nextThread = {
    ...thread,
    openQuestions: remainingQuestions,
    resolvedQuestions: [...thread.resolvedQuestions, resolvedQuestion],
    pendingSide: remainingQuestions[0]?.directedTo || "none",
    lastResponseAt: now,
    updatedAt: now,
    acceptanceCriteriaSuggestions: uniqueStrings([
      ...(thread.acceptanceCriteriaSuggestions || []),
      resolvedQuestion.acceptanceCriteriaSuggestion
    ])
  };

  nextThread.aiSummary = await summarizeClarificationThread({ issue, thread: nextThread });
  return nextThread;
}

module.exports = {
  addBridgeQuestion,
  buildClarificationThread,
  resolveBridgeQuestion
};
