const { STABILITY_THRESHOLD, VAGUE_PATTERNS } = require("../../types/domain");
const { extractQuestionCandidates, findBlockers, normalizeWhitespace } = require("../../lib/text");

function countPatternMatches(text, patterns) {
  return patterns.reduce((total, pattern) => total + (text.match(pattern) || []).length, 0);
}

function buildMissingQuestions(issue, ambiguityCount) {
  const questions = [];

  if (!issue.descriptionText) {
    questions.push("What problem are we solving and what outcome is expected?");
  }

  if (!/acceptance criteria|done when|success criteria/i.test(issue.descriptionText)) {
    questions.push("What are the acceptance criteria or done conditions?");
  }

  if (!issue.components.length) {
    questions.push("Which product area or component owns this change?");
  }

  if (ambiguityCount > 2) {
    questions.push("Which part of the ticket wording should be made more precise before implementation?");
  }

  return questions;
}

function computeRequirementStability(issue, existingThread) {
  const combinedText = normalizeWhitespace(
    [issue.summary, issue.descriptionText, ...(issue.comments || []).map((comment) => comment.bodyText)].join("\n")
  );

  const ambiguityCount = countPatternMatches(combinedText, VAGUE_PATTERNS);
  const derivedOpenQuestions = extractQuestionCandidates(combinedText).length;
  const existingOpenQuestions = existingThread?.openQuestions?.length || 0;
  const unresolvedQuestions = Math.max(derivedOpenQuestions, existingOpenQuestions);
  const missingAcceptanceCriteria = !/acceptance criteria|done when|success criteria/i.test(issue.descriptionText);
  const descriptionRecentlyChanged = issue.changelog.some(
    (change) =>
      change.field === "description" &&
      Date.now() - new Date(change.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  const conflictingComments = issue.comments.filter((comment) => /but|however|conflict|contradict/i.test(comment.bodyText)).length;
  const blockers = issue.comments.flatMap((comment) => findBlockers(comment.bodyText));

  let score = 100;
  score -= ambiguityCount * 8;
  score -= unresolvedQuestions * 6;
  score -= missingAcceptanceCriteria ? 18 : 0;
  score -= !issue.descriptionText || issue.descriptionText.length < 40 ? 14 : 0;
  score -= descriptionRecentlyChanged ? 10 : 0;
  score -= Math.min(conflictingComments * 7, 14);
  score -= Math.min(blockers.length * 5, 10);
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    threshold: STABILITY_THRESHOLD,
    isStableEnoughForRecommendation: score >= STABILITY_THRESHOLD,
    ambiguityCount,
    unresolvedQuestions,
    missingQuestions: buildMissingQuestions(issue, ambiguityCount),
    blockers: [...new Set(blockers)]
  };
}

module.exports = {
  computeRequirementStability
};
