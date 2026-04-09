const { DEMO_PROFILE_TEMPLATES } = require("../../constants/demo-profiles");
const { DOMAIN_KEYWORDS, STACK_KEYWORDS } = require("../../types/domain");
const { deterministicNumber, normalizeWhitespace, tokenize, uniqueStrings } = require("../../lib/text");

const DEMO_NAMES = ["Avery Chen", "Mila Hartmann", "Jonas Silva", "Priya Nanda", "Elena Markovic"];

function keywordScore(text, keywordMap) {
  const lower = normalizeWhitespace(text).toLowerCase();
  return Object.entries(keywordMap)
    .map(([key, keywords]) => ({
      key,
      score: keywords.reduce((total, keyword) => total + (lower.includes(keyword) ? 1 : 0), 0)
    }))
    .sort((left, right) => right.score - left.score);
}

function classifyIssue(issue) {
  const source = `${issue.summary} ${issue.descriptionText} ${issue.labels.join(" ")} ${issue.components.join(" ")}`;
  const domains = keywordScore(source, DOMAIN_KEYWORDS);
  const stacks = keywordScore(source, STACK_KEYWORDS);

  const domain = domains[0]?.score ? domains[0].key : "platform";
  const stack = stacks[0]?.score ? stacks[0].key : "node";

  const complexitySignals = [
    issue.priority.toLowerCase().includes("highest") || issue.priority.toLowerCase().includes("critical"),
    issue.components.length > 1,
    issue.labels.length > 2,
    issue.descriptionText.length > 280
  ].filter(Boolean).length;

  const complexity = complexitySignals >= 3 ? "high" : complexitySignals === 2 ? "medium" : "low";
  const likelySkills = uniqueStrings([
    domain,
    stack,
    ...issue.labels,
    ...issue.components,
    ...tokenize(issue.summary).slice(0, 4)
  ]);

  return {
    domain,
    stack,
    complexity,
    likelySkills
  };
}

function buildProfileFromUser(user, template, similarIssues) {
  const relatedIssues = similarIssues.filter((issue) => issue.assignee?.accountId === user.accountId);
  const relatedTags = uniqueStrings(
    relatedIssues.flatMap((issue) => [...issue.labels, ...issue.components, ...tokenize(issue.summary).slice(0, 2)])
  );

  return {
    accountId: user.accountId,
    displayName: user.displayName,
    role: template.role,
    skillTags: uniqueStrings([...template.skillTags, ...relatedTags.slice(0, 3)]),
    featureAreas: uniqueStrings([...template.featureAreas, ...relatedIssues.flatMap((issue) => issue.components)]),
    preferredStack: template.preferredStack,
    workloadScore: deterministicNumber(`${user.accountId}:workload`, 28, 82),
    avgCorrectionCount: deterministicNumber(`${user.accountId}:corrections`, 0, 5),
    firstPassApprovalRate: deterministicNumber(`${user.accountId}:approval`, 64, 96),
    avgResponseTime: deterministicNumber(`${user.accountId}:response`, 2, 18),
    qualityScore: deterministicNumber(`${user.accountId}:quality`, 64, 95),
    collaborationScore: deterministicNumber(`${user.accountId}:collaboration`, 68, 95),
    recentTickets: relatedIssues.slice(0, 5).map((issue) => issue.key),
    profileSource: relatedIssues.length ? "inferred" : "demo"
  };
}

function hydrateProfiles(assignableUsers, storedProfiles, similarIssues) {
  if (!assignableUsers.length && storedProfiles.length) {
    return storedProfiles;
  }

  if (!assignableUsers.length && !storedProfiles.length) {
    return DEMO_PROFILE_TEMPLATES.map((template, index) => ({
      accountId: `demo-${index + 1}`,
      displayName: DEMO_NAMES[index % DEMO_NAMES.length],
      role: template.role,
      skillTags: template.skillTags,
      featureAreas: template.featureAreas,
      preferredStack: template.preferredStack,
      workloadScore: deterministicNumber(`demo:${index}:workload`, 28, 82),
      avgCorrectionCount: deterministicNumber(`demo:${index}:corrections`, 0, 5),
      firstPassApprovalRate: deterministicNumber(`demo:${index}:approval`, 64, 96),
      avgResponseTime: deterministicNumber(`demo:${index}:response`, 2, 18),
      qualityScore: deterministicNumber(`demo:${index}:quality`, 64, 95),
      collaborationScore: deterministicNumber(`demo:${index}:collaboration`, 68, 95),
      recentTickets: [],
      profileSource: "demo"
    }));
  }

  const storedByAccountId = new Map(storedProfiles.map((profile) => [profile.accountId, profile]));

  return assignableUsers.map((user, index) => {
    const existing = storedByAccountId.get(user.accountId);
    if (existing) {
      return existing;
    }

    const template = DEMO_PROFILE_TEMPLATES[index % DEMO_PROFILE_TEMPLATES.length];
    return buildProfileFromUser(user, template, similarIssues);
  });
}

function overlapScore(left, right, maxScore) {
  const leftSet = new Set((left || []).map((value) => value.toLowerCase()));
  const rightSet = new Set((right || []).map((value) => value.toLowerCase()));

  if (!leftSet.size || !rightSet.size) {
    return 0;
  }

  let matches = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) {
      matches += 1;
    }
  }

  return Math.min(maxScore, Math.round((matches / Math.max(leftSet.size, 1)) * maxScore));
}

function rankCandidates({ issue, classification, profiles, similarIssues, stability }) {
  const results = profiles.map((profile) => {
    const similarAssignments = similarIssues.filter((candidate) => candidate.assignee?.accountId === profile.accountId);
    const skillMatch = overlapScore(classification.likelySkills, profile.skillTags, 25);
    const domainFamiliarity =
      overlapScore([classification.domain, ...issue.components], profile.featureAreas, 15) +
      Math.min(similarAssignments.length * 3, 6);
    const ownershipFamiliarity = Math.min(similarAssignments.length * 3, 10);
    const workloadScore = Math.max(0, 15 - Math.round((profile.workloadScore / 100) * 15));
    const qualityScore = Math.round((profile.qualityScore / 100) * 15);
    const collaborationScore = Math.round((profile.collaborationScore / 100) * 10);
    const riskPenalty = Math.min(
      15,
      (profile.avgCorrectionCount || 0) * 2 + (profile.avgResponseTime > 12 ? 3 : 0) + (profile.profileSource !== "configured" ? 2 : 0)
    );

    const totalScore = Math.max(
      0,
      Math.min(100, skillMatch + domainFamiliarity + ownershipFamiliarity + workloadScore + qualityScore + collaborationScore - riskPenalty)
    );

    const reasons = uniqueStrings([
      skillMatch ? `${profile.displayName} matches ${Math.max(1, Math.round((skillMatch / 25) * classification.likelySkills.length))} core skill signals` : "",
      domainFamiliarity ? `has familiarity with ${classification.domain} and related feature areas` : "",
      ownershipFamiliarity ? `has worked on ${similarAssignments.length} similar issue(s)` : "",
      workloadScore >= 10 ? "currently has workable capacity" : "is carrying a moderate workload",
      profile.qualityScore >= 80 ? "has strong recent quality indicators" : "",
      profile.collaborationScore >= 80 ? "has strong collaboration indicators" : "",
      profile.profileSource !== "configured" ? "profile metrics are estimated from demo and recent issue signals" : ""
    ]);

    return {
      ...profile,
      totalScore,
      breakdown: {
        skillMatch,
        domainFamiliarity,
        ownershipFamiliarity,
        workloadScore,
        qualityScore,
        collaborationScore,
        riskPenalty
      },
      reasons,
      risks: uniqueStrings([
        riskPenalty >= 8 ? "elevated delivery risk due to correction or response history" : "",
        profile.profileSource !== "configured" ? "candidate profile uses estimated metrics" : ""
      ]),
      isAssignable: !profile.accountId.startsWith("demo-")
    };
  });

  const ranked = results.sort((left, right) => right.totalScore - left.totalScore);
  const topThree = ranked.slice(0, 3);
  const topCandidate = topThree[0];
  const scoreGap = topThree[1] ? topThree[0].totalScore - topThree[1].totalScore : topThree[0]?.totalScore || 0;

  let confidence = "low";
  if (stability >= 80 && (topCandidate?.totalScore || 0) >= 75 && scoreGap >= 10) {
    confidence = "high";
  } else if (stability >= 65 && (topCandidate?.totalScore || 0) >= 65 && scoreGap >= 5) {
    confidence = "medium";
  }

  return {
    classification,
    topThree,
    topCandidate,
    confidence,
    clarifyFirst: stability < 65 || (topCandidate?.totalScore || 0) < 60
  };
}

module.exports = {
  classifyIssue,
  hydrateProfiles,
  rankCandidates
};
