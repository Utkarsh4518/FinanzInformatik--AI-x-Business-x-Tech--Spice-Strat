const STORAGE_KEY = "specbridge-local-workspace";

const BASE_WORKSPACE = {
  issue: {
    issueKey: "SPB-142",
    summary: "Add a beneficiary import button to the payroll setup screen",
    status: "In Progress",
    reporter: {
      accountId: "requester-1",
      displayName: "Anika Bauer"
    },
    assignee: {
      accountId: "dev-2",
      displayName: "Mila Hartmann"
    }
  },
  developerProfiles: [
    {
      accountId: "dev-2",
      displayName: "Mila Hartmann",
      role: "Frontend Engineer",
      totalScore: 88,
      reasons: [
        "matches core UI and workflow skill signals",
        "has strong collaboration indicators",
        "has worked on similar payroll admin flows"
      ],
      profileSource: "configured",
      isAssignable: true
    },
    {
      accountId: "dev-1",
      displayName: "Avery Chen",
      role: "Full-Stack Engineer",
      totalScore: 79,
      reasons: [
        "covers React and integration signals",
        "has workable delivery capacity"
      ],
      profileSource: "configured",
      isAssignable: true
    },
    {
      accountId: "dev-3",
      displayName: "Jonas Silva",
      role: "Platform Engineer",
      totalScore: 68,
      reasons: [
        "knows workflow automation and ticketing integrations",
        "moderate workload"
      ],
      profileSource: "inferred",
      isAssignable: true
    }
  ],
  ticketIntelligence: {
    issueKey: "SPB-142",
    requirementStabilityScore: 72,
    ambiguityCount: 2,
    recommendedAssignee: "dev-2",
    backupAssignees: ["dev-1", "dev-3"],
    assignmentReason:
      "Mila Hartmann is the current lead match for SPB-142 with medium confidence because she matches the main UI workflow signals, has collaborated well with business analysts before, and has similar payroll admin experience.",
    assignmentRisks: ["CSV file rules are still not fully specified"],
    matchScores: {},
    openQuestionsCount: 2,
    unresolvedBlockers: ["waiting"],
    clarificationStatus: "open",
    lastAISummary:
      "SPB-142 is in progress. Stability is 72/100 with 2 open questions. Best assignee signal: Mila Hartmann (88/100).",
    lastAnalyzedAt: "2026-04-09T19:30:00.000Z",
    confidence: "medium",
    classification: {
      domain: "frontend",
      stack: "react",
      complexity: "medium",
      likelySkills: ["frontend", "react", "forms", "import", "workflow"]
    },
    currentAssignee: "dev-2",
    status: "In Progress",
    availableTransitions: [
      { id: "11", toStatus: "In Review" },
      { id: "21", toStatus: "Done" }
    ]
  },
  clarificationThread: {
    issueKey: "SPB-142",
    requesterAccountId: "requester-1",
    assigneeAccountId: "dev-2",
    reviewerAccountId: "reviewer-1",
    openQuestions: [
      {
        id: "q-1",
        text: "Should the import accept both CSV and Excel files?",
        askedByDisplayName: "Mila Hartmann",
        askedAt: "2026-04-09T18:45:00.000Z",
        directedTo: "requester",
        businessRewrite: "Do users need one spreadsheet format or multiple upload formats?",
        technicalRewrite: "Please confirm the allowed file types for the import parser."
      },
      {
        id: "q-2",
        text: "What validation rules should block a row before save?",
        askedByDisplayName: "Mila Hartmann",
        askedAt: "2026-04-09T19:00:00.000Z",
        directedTo: "requester",
        businessRewrite: "Which mistakes in the uploaded data should stop the import?",
        technicalRewrite: "List the row-level validation failures that should reject persistence."
      }
    ],
    resolvedQuestions: [
      {
        id: "q-r-1",
        text: "Should the new button be visible for all payroll admins?",
        resolution: "Yes, every payroll admin should see it in the setup screen header.",
        resolvedAt: "2026-04-09T17:40:00.000Z"
      }
    ],
    pendingSide: "requester",
    aiSummary:
      "Bridge summary for SPB-142: 2 open questions, 1 resolved clarification, and the thread is currently waiting on the requester.",
    lastResponseAt: "2026-04-09T19:00:00.000Z",
    acceptanceCriteriaSuggestions: [
      "Done when payroll admins can see an import button in the setup header.",
      "Done when invalid beneficiary rows are surfaced before save with actionable errors."
    ],
    unresolvedBlockers: ["waiting"],
    createdAt: "2026-04-09T17:10:00.000Z",
    updatedAt: "2026-04-09T19:00:00.000Z"
  },
  lifecycleEvents: [
    {
      eventType: "created",
      timestamp: "2026-04-09T16:50:00.000Z",
      aiInterpretation: "Lifecycle update for SPB-142: created. Stability is 72/100. No blockers are currently flagged."
    },
    {
      eventType: "analyzed",
      timestamp: "2026-04-09T17:00:00.000Z",
      aiInterpretation: "Lifecycle update for SPB-142: analyzed. Stability is 72/100. No blockers are currently flagged."
    },
    {
      eventType: "recommended_assignee",
      timestamp: "2026-04-09T17:05:00.000Z",
      aiInterpretation: "Lifecycle update for SPB-142: recommended assignee. Stability is 72/100. No blockers are currently flagged."
    },
    {
      eventType: "assigned",
      timestamp: "2026-04-09T17:15:00.000Z",
      aiInterpretation: "Lifecycle update for SPB-142: assigned. Stability is 72/100. No blockers are currently flagged."
    },
    {
      eventType: "clarification_requested",
      timestamp: "2026-04-09T18:45:00.000Z",
      aiInterpretation: "Lifecycle update for SPB-142: clarification requested. Stability is 72/100. 1 blocker needs attention."
    }
  ],
  recommendation: {
    clarifyFirst: false,
    confidence: "medium",
    topCandidates: [],
    missingQuestions: []
  },
  similarIssues: [
    { key: "SPB-101", summary: "Bulk upload for vendor onboarding" },
    { key: "SPB-099", summary: "Admin table import validation cleanup" }
  ]
};

BASE_WORKSPACE.recommendation.topCandidates = BASE_WORKSPACE.developerProfiles;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readWorkspace() {
  if (typeof window === "undefined") {
    return clone(BASE_WORKSPACE);
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return clone(BASE_WORKSPACE);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return clone(BASE_WORKSPACE);
  }
}

function writeWorkspace(workspace) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }

  return clone(workspace);
}

function latestCandidate(workspace, accountId) {
  return workspace.recommendation.topCandidates.find((candidate) => candidate.accountId === accountId);
}

export function getLocalContext() {
  const params = new URLSearchParams(window.location.search);
  const surface = params.get("surface") || "panel";
  const moduleKeyMap = {
    panel: "specbridge-issue-panel",
    glance: "specbridge-issue-glance",
    activity: "specbridge-issue-activity",
    background: "specbridge-issue-background"
  };
  const moduleKey = moduleKeyMap[surface] || moduleKeyMap.panel;

  return {
    moduleKey,
    extension: {
      moduleKey,
      issue: {
        key: "SPB-142"
      }
    }
  };
}

export async function getLocalWorkspace() {
  return readWorkspace();
}

export async function refreshLocalWorkspace() {
  const workspace = readWorkspace();
  workspace.ticketIntelligence.lastAnalyzedAt = new Date().toISOString();
  return writeWorkspace(workspace);
}

export async function seedLocalProfiles() {
  return readWorkspace();
}

export async function assignLocalRecommendation(accountId) {
  const workspace = readWorkspace();
  const candidate = latestCandidate(workspace, accountId);

  if (candidate) {
    workspace.issue.assignee = {
      accountId: candidate.accountId,
      displayName: candidate.displayName
    };
    workspace.ticketIntelligence.currentAssignee = candidate.accountId;
    workspace.ticketIntelligence.recommendedAssignee = candidate.accountId;
    workspace.lifecycleEvents.push({
      eventType: "assigned",
      timestamp: new Date().toISOString(),
      aiInterpretation: `Lifecycle update for ${workspace.issue.issueKey}: assigned. Stability is ${workspace.ticketIntelligence.requirementStabilityScore}/100.`
    });
  }

  return writeWorkspace(workspace);
}

export async function createLocalClarification(payload) {
  const workspace = readWorkspace();
  const nextQuestion = {
    id: `local-q-${Date.now()}`,
    text: payload.text,
    askedByDisplayName: "Local demo user",
    askedAt: new Date().toISOString(),
    directedTo: payload.directedTo,
    businessRewrite: payload.text,
    technicalRewrite: payload.text
  };

  workspace.clarificationThread.openQuestions.push(nextQuestion);
  workspace.clarificationThread.pendingSide = payload.directedTo;
  workspace.clarificationThread.lastResponseAt = nextQuestion.askedAt;
  workspace.clarificationThread.aiSummary = `Bridge summary for ${workspace.issue.issueKey}: ${workspace.clarificationThread.openQuestions.length} open questions, ${workspace.clarificationThread.resolvedQuestions.length} resolved clarifications, and the thread is currently waiting on ${payload.directedTo}.`;
  workspace.ticketIntelligence.openQuestionsCount = workspace.clarificationThread.openQuestions.length;
  workspace.lifecycleEvents.push({
    eventType: "clarification_requested",
    timestamp: nextQuestion.askedAt,
    aiInterpretation: `Lifecycle update for ${workspace.issue.issueKey}: clarification requested. Stability is ${workspace.ticketIntelligence.requirementStabilityScore}/100.`
  });

  return writeWorkspace(workspace);
}

export async function resolveLocalClarification(payload) {
  const workspace = readWorkspace();
  const index = workspace.clarificationThread.openQuestions.findIndex((question) => question.id === payload.questionId);

  if (index >= 0) {
    const [resolved] = workspace.clarificationThread.openQuestions.splice(index, 1);
    workspace.clarificationThread.resolvedQuestions.push({
      ...resolved,
      resolution: payload.resolution,
      resolvedAt: new Date().toISOString()
    });
    workspace.clarificationThread.pendingSide = workspace.clarificationThread.openQuestions[0]?.directedTo || "none";
    workspace.ticketIntelligence.openQuestionsCount = workspace.clarificationThread.openQuestions.length;
    workspace.clarificationThread.aiSummary = `Bridge summary for ${workspace.issue.issueKey}: ${workspace.clarificationThread.openQuestions.length} open questions, ${workspace.clarificationThread.resolvedQuestions.length} resolved clarifications, and the thread is currently waiting on ${workspace.clarificationThread.pendingSide}.`;
    workspace.lifecycleEvents.push({
      eventType: "clarified",
      timestamp: new Date().toISOString(),
      aiInterpretation: `Lifecycle update for ${workspace.issue.issueKey}: clarified. Stability is ${workspace.ticketIntelligence.requirementStabilityScore}/100.`
    });
  }

  return writeWorkspace(workspace);
}

export async function publishLocalSummaryComment() {
  const workspace = readWorkspace();
  workspace.lifecycleEvents.push({
    eventType: "status_changed",
    timestamp: new Date().toISOString(),
    aiInterpretation: `Lifecycle update for ${workspace.issue.issueKey}: summary comment published for stakeholders. Stability is ${workspace.ticketIntelligence.requirementStabilityScore}/100.`
  });
  return writeWorkspace(workspace);
}
