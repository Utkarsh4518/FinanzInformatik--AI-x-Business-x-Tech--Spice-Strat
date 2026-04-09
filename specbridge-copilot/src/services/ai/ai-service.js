const { normalizeWhitespace } = require("../../lib/text");

const BUSINESS_REPLACEMENTS = [
  [/API/gi, "integration endpoint"],
  [/refactor/gi, "internal code cleanup"],
  [/regression/gi, "unexpected break in existing behavior"],
  [/latency/gi, "slow system response"],
  [/deploy(ment)?/gi, "release"]
];

const TECHNICAL_REPLACEMENTS = [
  [/\bbutton\b/gi, "UI button control"],
  [/\bpage\b/gi, "screen or route"],
  [/\bslow\b/gi, "performance regression"],
  [/\bbroken\b/gi, "failing behavior"],
  [/\bfix\b/gi, "implement and validate a change for"]
];

function replaceAll(text, replacements) {
  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

async function rewriteForAudience(text, audience) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return {
      original: "",
      rewritten: ""
    };
  }

  if (audience === "business") {
    return {
      original: normalized,
      rewritten: replaceAll(normalized, BUSINESS_REPLACEMENTS)
    };
  }

  return {
    original: normalized,
    rewritten: replaceAll(normalized, TECHNICAL_REPLACEMENTS)
  };
}

async function createAssignmentExplanation({ issue, topCandidate, confidenceLabel, clarifyFirst, missingQuestions }) {
  if (clarifyFirst) {
    const questionText = missingQuestions.length ? ` Missing questions: ${missingQuestions.join(" | ")}.` : "";
    return `Requirements are still unstable for ${issue.issueKey}, so SpecBridge recommends clarifying before assigning.${questionText}`;
  }

  if (!topCandidate) {
    return `SpecBridge could not find a reliable assignee recommendation for ${issue.issueKey}.`;
  }

  const reasons = topCandidate.reasons.slice(0, 3).join("; ");
  return `${topCandidate.displayName} is the current lead match for ${issue.issueKey} with ${confidenceLabel} confidence because ${reasons}.`;
}

async function summarizeClarificationThread({ issue, thread }) {
  const openCount = thread.openQuestions.length;
  const resolvedCount = thread.resolvedQuestions.length;
  const pending = thread.pendingSide === "developer" ? "developer" : thread.pendingSide === "requester" ? "requester" : "neither side";

  return `Bridge summary for ${issue.issueKey}: ${openCount} open question(s), ${resolvedCount} resolved clarification(s), and the thread is currently waiting on ${pending}.`;
}

async function summarizeLifecycle({ issue, eventType, blockerCount, stabilityScore }) {
  const blockerText = blockerCount ? `${blockerCount} blocker(s) need attention.` : "No blockers are currently flagged.";
  return `Lifecycle update for ${issue.issueKey}: ${eventType.replace(/_/g, " ")}. Stability is ${stabilityScore}/100. ${blockerText}`;
}

async function createLatestSummary({ issue, intelligence, topCandidate }) {
  const candidateText = topCandidate
    ? `Best assignee signal: ${topCandidate.displayName} (${topCandidate.totalScore}/100).`
    : "No assignee recommendation is being pushed yet.";

  return `${issue.issueKey} is in ${issue.status}. Stability is ${intelligence.requirementStabilityScore}/100 with ${intelligence.openQuestionsCount} open question(s). ${candidateText}`;
}

module.exports = {
  createAssignmentExplanation,
  createLatestSummary,
  rewriteForAudience,
  summarizeClarificationThread,
  summarizeLifecycle
};
