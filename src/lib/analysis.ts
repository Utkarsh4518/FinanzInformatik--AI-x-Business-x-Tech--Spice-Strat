import { getAIProvider } from "@/lib/ai/factory";
import { vaguePhrases } from "@/lib/constants";
import { demoAlignment, demoAnalysis, demoDiffExplanation, demoSpec } from "@/lib/demo/data";
import { createId } from "@/lib/utils";
import type {
  AlignmentReport,
  AmbiguityFinding,
  CodebaseAnswer,
  DiffExplanation,
  RequirementAnalysis,
  RequirementMetadata,
  SharedSpec
} from "@/lib/types/domain";

export function detectAmbiguities(requirementText: string): AmbiguityFinding[] {
  const lowered = requirementText.toLowerCase();
  const matches = vaguePhrases.filter((phrase) => lowered.includes(phrase));

  if (matches.length === 0) {
    return [
      {
        id: createId("amb"),
        phrase: "business intent scope",
        severity: "low",
        whyItMatters: "Even clear requirements benefit from a short validation of constraints and expected outcomes.",
        suggestedClarification: "Confirm the target user, expected success metric, and non-goals before implementation begins.",
        status: "open",
        sourceConfidence: 0.72,
        sourceType: "inferred"
      }
    ];
  }

  return matches.map((phrase, index) => ({
    id: createId("amb"),
    phrase,
    severity: index === 0 ? "high" : "medium",
    whyItMatters: `The phrase "${phrase}" is subjective and could lead to different implementation decisions.`,
    suggestedClarification: `What does "${phrase}" mean in measurable terms for the business and engineering teams?`,
    status: "open",
    sourceConfidence: 0.93,
    sourceType: "explicit"
  }));
}

export function buildRequirementAnalysis(requirementText: string, metadata: RequirementMetadata): RequirementAnalysis {
  const ambiguities = detectAmbiguities(requirementText);

  return {
    ...demoAnalysis,
    summary:
      metadata.businessGoal
        ? `${metadata.businessGoal} The feature request focuses on: ${requirementText}`
        : `This request aims to turn the feature idea into a delivery-ready shared specification. ${requirementText}`,
    userStory: `As a ${metadata.userType ?? "target user"}, I want ${requirementText.toLowerCase()} so that the business goal can be achieved with less ambiguity.`,
    ambiguities,
    acceptanceCriteria: [
      "The requested behavior is described in shared business and technical language.",
      "Open ambiguities are surfaced instead of hidden.",
      "Suggested technical tasks and tests are generated.",
      "The output is suitable for review by business analysts and developers."
    ],
    technicalImpactSummary: [
      "Potential frontend, backend, validation, and testing areas were identified.",
      "The implementation should preserve existing patterns where evidence is available.",
      "Open questions should be resolved before approval."
    ]
  };
}

export function buildSharedSpecFromAnalysis(
  workspaceId: string,
  title: string,
  analysis: RequirementAnalysis,
  metadata: RequirementMetadata
): SharedSpec {
  return {
    ...demoSpec,
    workspaceId,
    featureName: title || "Untitled feature",
    businessIntent: metadata.businessGoal ?? analysis.summary,
    userStory: analysis.userStory,
    inputs: ["Requirement text", ...(metadata.frontendExpectations ? ["Frontend expectations"] : [])],
    outputs: ["Shared spec", "Developer checklist", "Alignment-ready acceptance criteria"],
    businessRules: [
      "Preserve the business meaning when translating into technical work.",
      "Flag ambiguity instead of implying certainty."
    ],
    validationRules: [
      "Missing business context should create open questions.",
      "Developer tasks must map back to requirement intent."
    ],
    errorStates: [
      "Insufficient requirement detail.",
      "No code evidence found.",
      "Provider not configured, using demo fallback."
    ],
    frontendExpectations: [
      metadata.frontendExpectations ?? "Use structured panels with clear next actions.",
      "Every button must trigger visible feedback."
    ],
    backendExpectations: [
      "Use provider abstraction and stream long-running operations.",
      "Persist activity events and spec updates."
    ],
    technicalTasks: analysis.technicalTasks,
    suggestedFiles: analysis.technicalTasks.flatMap((task) => task.files).slice(0, 6),
    suggestedTests: analysis.tests,
    openQuestions: analysis.ambiguities.map((ambiguity) => ambiguity.suggestedClarification),
    definitionOfDone: [
      "Business, developer, and reviewer views reflect the same feature intent.",
      "Open questions are visible before approval.",
      "Exports and checklists are ready for handoff."
    ],
    approvalStatus: analysis.ambiguities.length > 0 ? "needs-clarification" : "draft",
    version: demoSpec.version + 1,
    updatedAt: new Date().toISOString()
  };
}

export function buildDiffExplanation(rawDiff: string): DiffExplanation {
  return {
    ...demoDiffExplanation,
    executiveSummary:
      rawDiff.trim().length > 0
        ? `The submitted diff updates the implementation and has been translated into user-facing and technical impacts.`
        : demoDiffExplanation.executiveSummary,
    changedFiles:
      rawDiff.trim().length > 0 ? rawDiff.split("\n").filter(Boolean).slice(0, 5) : demoDiffExplanation.changedFiles
  };
}

export function buildAlignmentReport(workspaceId: string, diffText: string, spec: SharedSpec): AlignmentReport {
  return {
    ...demoAlignment,
    workspaceId,
    sourceDiff: diffText || demoAlignment.sourceDiff,
    followUpQuestions: [
      ...demoAlignment.followUpQuestions,
      ...spec.openQuestions.slice(0, 2)
    ]
  };
}

function ensureAnalysisShape(analysis: RequirementAnalysis, requirementText: string): RequirementAnalysis {
  return {
    ...buildRequirementAnalysis(requirementText, {}),
    ...analysis,
    ambiguities: (analysis.ambiguities ?? []).map((ambiguity) => ({
      ...ambiguity,
      id: ambiguity.id || createId("amb"),
      status: ambiguity.status ?? "open",
      sourceConfidence: ambiguity.sourceConfidence ?? 0.85,
      sourceType: ambiguity.sourceType ?? "inferred"
    })),
    technicalTasks: (analysis.technicalTasks ?? []).map((task) => ({
      ...task,
      id: task.id || createId("task"),
      files: task.files ?? [],
      tests: task.tests ?? [],
      status: task.status ?? "todo",
      sourceConfidence: task.sourceConfidence ?? 0.85,
      sourceType: task.sourceType ?? "inferred"
    })),
    technicalImpactSummary: analysis.technicalImpactSummary ?? []
  };
}

function ensureCodebaseAnswerShape(answer: CodebaseAnswer, question: string, mode: CodebaseAnswer["mode"]): CodebaseAnswer {
  return {
    question,
    mode,
    answer: answer.answer ?? "",
    businessExplanation: answer.businessExplanation ?? answer.answer ?? "",
    developerExplanation: answer.developerExplanation ?? answer.answer ?? "",
    relatedFiles: answer.relatedFiles ?? [],
    riskNotes: answer.riskNotes ?? [],
    citations: answer.citations ?? [],
    sourceConfidence: answer.sourceConfidence ?? 0.82,
    sourceType: answer.sourceType ?? "inferred"
  };
}

function ensureDiffExplanationShape(explanation: DiffExplanation, rawDiff: string): DiffExplanation {
  const fallback = buildDiffExplanation(rawDiff);
  return {
    ...fallback,
    ...explanation,
    userImpact: explanation.userImpact ?? fallback.userImpact,
    technicalChanges: explanation.technicalChanges ?? fallback.technicalChanges,
    businessValue: explanation.businessValue ?? fallback.businessValue,
    sideEffects: explanation.sideEffects ?? fallback.sideEffects,
    nonImplementedItems: explanation.nonImplementedItems ?? fallback.nonImplementedItems,
    demoScript: explanation.demoScript ?? fallback.demoScript,
    changedFiles: explanation.changedFiles ?? fallback.changedFiles
  };
}

function ensureAlignmentReportShape(report: AlignmentReport, workspaceId: string, diffText: string, spec: SharedSpec): AlignmentReport {
  const fallback = buildAlignmentReport(workspaceId, diffText, spec);
  return {
    ...fallback,
    ...report,
    traceability: report.traceability ?? fallback.traceability,
    fullyImplementedItems: report.fullyImplementedItems ?? fallback.fullyImplementedItems,
    partiallyImplementedItems: report.partiallyImplementedItems ?? fallback.partiallyImplementedItems,
    missingItems: report.missingItems ?? fallback.missingItems,
    assumptions: report.assumptions ?? fallback.assumptions,
    businessRisks: report.businessRisks ?? fallback.businessRisks,
    uxRisks: report.uxRisks ?? fallback.uxRisks,
    testCoverageGaps: report.testCoverageGaps ?? fallback.testCoverageGaps,
    followUpQuestions: report.followUpQuestions ?? fallback.followUpQuestions
  };
}

export async function generateRequirementAnalysis(
  requirementText: string,
  metadata: RequirementMetadata,
  roleMode: "business" | "developer" | "reviewer",
  wordingMode: "simple" | "technical"
) {
  const provider = getAIProvider();
  if (provider.id === "mock") {
    return buildRequirementAnalysis(requirementText, metadata);
  }

  const metadataBlock = JSON.stringify(metadata, null, 2);
  const prompt = [
    `Role mode: ${roleMode}`,
    `Wording mode: ${wordingMode}`,
    "Requirement:",
    requirementText,
    "Metadata:",
    metadataBlock,
    "Return JSON only."
  ].join("\n\n");

  try {
    const generated = await provider.generateRequirementAnalysis(prompt);
    return ensureAnalysisShape(generated, requirementText);
  } catch {
    return buildRequirementAnalysis(requirementText, metadata);
  }
}

export async function generateCodebaseAnswer(params: {
  question: string;
  mode: "business" | "developer" | "reviewer";
  selectedFile?: string;
  context: string;
}) {
  const provider = getAIProvider();
  if (provider.id === "mock") {
    return ensureCodebaseAnswerShape(
      {
        question: params.question,
        mode: params.mode,
        answer: `Based on the indexed repository context, the most relevant implementation areas are highlighted in the related files section.`,
        businessExplanation: `The indexed repository suggests where this feature lives today and which parts are most likely to change.`,
        developerExplanation: `Use the related files and citations as the likely implementation entry points for this request.`,
        relatedFiles: [],
        riskNotes: ["Live AI provider is not configured, so this response uses indexed heuristics."],
        citations: [],
        sourceConfidence: 0.76,
        sourceType: "inferred"
      },
      params.question,
      params.mode
    );
  }

  const prompt = [
    `Mode: ${params.mode}`,
    `Question: ${params.question}`,
    params.selectedFile ? `Selected file: ${params.selectedFile}` : "Selected file: none",
    "Repository context:",
    params.context,
    "Return JSON only."
  ].join("\n\n");

  try {
    const generated = await provider.generateCodebaseAnswer(prompt);
    return ensureCodebaseAnswerShape(generated, params.question, params.mode);
  } catch {
    return ensureCodebaseAnswerShape(
      {
        question: params.question,
        mode: params.mode,
        answer: "The AI provider could not complete the repository explanation, so a fallback summary is shown.",
        businessExplanation: "The repository was indexed, but the live explanation step failed. Review the related files and try again.",
        developerExplanation: "Fallback response returned because the live provider call failed.",
        relatedFiles: [],
        riskNotes: ["The live explanation provider failed during this request."],
        citations: [],
        sourceConfidence: 0.55,
        sourceType: "inferred"
      },
      params.question,
      params.mode
    );
  }
}

export async function generateDiffExplanation(rawDiff: string, roleMode: "business" | "developer" | "reviewer") {
  const provider = getAIProvider();
  if (provider.id === "mock") {
    return buildDiffExplanation(rawDiff);
  }

  const prompt = [
    `Role mode: ${roleMode}`,
    "Summarize the diff in business and technical language.",
    "Diff:",
    rawDiff,
    "Return JSON only."
  ].join("\n\n");

  try {
    const generated = await provider.generateDiffExplanation(prompt);
    return ensureDiffExplanationShape(generated, rawDiff);
  } catch {
    return buildDiffExplanation(rawDiff);
  }
}

export async function generateAlignmentReport(workspaceId: string, diffText: string, spec: SharedSpec) {
  const provider = getAIProvider();
  if (provider.id === "mock") {
    return buildAlignmentReport(workspaceId, diffText, spec);
  }

  const prompt = [
    "Compare the shared spec to the implementation evidence and return JSON only.",
    "Shared spec:",
    JSON.stringify(spec, null, 2),
    "Diff text:",
    diffText
  ].join("\n\n");

  try {
    const generated = await provider.generateDiffExplanation(prompt);
    const report: AlignmentReport = {
      workspaceId,
      sourceDiff: diffText,
      coverageScore: 75,
      fullyImplementedItems: [],
      partiallyImplementedItems: [],
      missingItems: [],
      assumptions: [],
      businessRisks: generated.sideEffects ?? [],
      uxRisks: generated.nonImplementedItems ?? [],
      testCoverageGaps: [],
      followUpQuestions: spec.openQuestions,
      traceability: spec.definitionOfDone.map((item) => ({
        criterion: item,
        status: "partial",
        evidence: generated.changedFiles ?? [],
        notes: generated.executiveSummary
      })),
      sourceConfidence: 0.74,
      sourceType: "inferred"
    };
    return ensureAlignmentReportShape(report, workspaceId, diffText, spec);
  } catch {
    return buildAlignmentReport(workspaceId, diffText, spec);
  }
}
