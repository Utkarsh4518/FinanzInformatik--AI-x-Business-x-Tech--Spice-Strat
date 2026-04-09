import { createId } from "@/lib/utils";
import type {
  ActivityEvent,
  AlignmentReport,
  AmbiguityFinding,
  CodebaseAnswer,
  DemoWorkspacePayload,
  DiffExplanation,
  RepoFileNode,
  RepoIndexStatus,
  RequirementAnalysis,
  SharedSpec,
  TechnicalTask,
  VoiceComment,
  VoiceSession,
  Workspace
} from "@/lib/types/domain";

const now = new Date().toISOString();

const ambiguities: AmbiguityFinding[] = [
  {
    id: createId("amb"),
    phrase: "existing loan calculator",
    severity: "medium",
    whyItMatters: "The current calculator shape determines where the new input and result should appear.",
    suggestedClarification: "Confirm whether the new calculation should extend the current repayment form or open as a dedicated calculator tab.",
    status: "open",
    sourceConfidence: 0.92,
    sourceType: "explicit"
  },
  {
    id: createId("amb"),
    phrase: "monthly payment",
    severity: "high",
    whyItMatters: "Users need a clear rule for whether taxes, insurance, or fees are included in the payment figure.",
    suggestedClarification: "Clarify whether monthly payment means principal plus interest only or the full monthly customer obligation.",
    status: "open",
    sourceConfidence: 0.96,
    sourceType: "explicit"
  },
  {
    id: createId("amb"),
    phrase: "calculate how many months",
    severity: "medium",
    whyItMatters: "Rounding behavior changes the result shown to the customer and the acceptance tests.",
    suggestedClarification: "Specify whether the calculator should round up to the next full month when the result is fractional.",
    status: "open",
    sourceConfidence: 0.89,
    sourceType: "inferred"
  }
];

const technicalTasks: TechnicalTask[] = [
  {
    id: createId("task"),
    title: "Extend calculator form with monthly payment input",
    description: "Add a monthly payment field, validation messaging, and a result panel for calculated loan term.",
    owner: "frontend",
    files: ["src/components/LoanCalculatorForm.tsx", "src/lib/validation/loan.ts"],
    tests: ["src/components/LoanCalculatorForm.test.tsx"],
    status: "todo",
    sourceConfidence: 0.94,
    sourceType: "explicit"
  },
  {
    id: createId("task"),
    title: "Add amortization-based term calculation service",
    description: "Implement the repayment duration formula, guard against impossible payment values, and expose the result to the UI.",
    owner: "backend",
    files: ["src/lib/calculations/loan.ts", "src/app/api/calculations/term/route.ts"],
    tests: ["src/lib/calculations/loan.test.ts"],
    status: "todo",
    sourceConfidence: 0.95,
    sourceType: "explicit"
  },
  {
    id: createId("task"),
    title: "Update regression coverage",
    description: "Add unit and integration tests covering valid, invalid, and edge-case term calculations.",
    owner: "qa",
    files: ["src/lib/calculations/loan.test.ts", "src/app/api/calculations/term/route.test.ts"],
    tests: ["src/lib/calculations/loan.test.ts"],
    status: "todo",
    sourceConfidence: 0.9,
    sourceType: "inferred"
  }
];

export const demoWorkspace: Workspace = {
  id: "workspace_demo_loan_term",
  title: "Loan term feature request",
  roleMode: "business",
  requirementText:
    "Add a loan term calculation feature to the existing loan calculator so a user can enter loan amount, interest rate, and monthly payment to calculate how many months are needed to repay the loan.",
  metadata: {
    businessGoal: "Help customers evaluate affordability before applying.",
    successMetric: "More completed calculator sessions and fewer branch clarification calls.",
    deadline: "2026-05-15",
    priority: "High",
    userType: "Retail banking customer",
    frontendExpectations: "Keep it inside the current calculator card with plain-language guidance.",
    constraints: "Must reuse existing calculator layout and validation style."
  },
  createdAt: now,
  updatedAt: now,
  status: "active",
  isDemo: true
};

export const demoAnalysis: RequirementAnalysis = {
  summary:
    "The request adds a new way for customers to estimate repayment duration using data they already understand: loan amount, interest rate, and intended monthly payment.",
  userStory:
    "As a prospective borrower, I want to enter loan amount, interest rate, and monthly payment so I can understand how long repayment would take before I commit.",
  acceptanceCriteria: [
    "The calculator accepts loan amount, annual interest rate, and monthly payment as inputs.",
    "The system returns the estimated number of months required to repay the loan.",
    "The system warns the user when the monthly payment is too low to reduce the balance.",
    "The result is displayed in plain language and remains consistent with the existing calculator design.",
    "Validation errors explain how the user can correct the input."
  ],
  ambiguities,
  edgeCases: [
    "Monthly payment is equal to or below monthly interest accrual.",
    "Interest rate is zero, which should fall back to a linear repayment formula.",
    "Users enter decimal values or very large loan amounts.",
    "Monthly payment yields a fractional month result."
  ],
  outOfScope: [
    "Generating a full repayment schedule.",
    "Saving customer scenarios to an account.",
    "Submitting a loan application."
  ],
  uiSuggestions: [
    "Add the monthly payment field directly below interest rate.",
    "Show the result in a high-contrast summary card titled Estimated repayment term.",
    "Display validation and warning text inline under the relevant field.",
    "Offer a helper tooltip that explains how monthly payment affects the term."
  ],
  technicalImpactSummary: [
    "Requires a new amortization calculation path.",
    "Needs new validation rules for impossible payment combinations.",
    "Touches calculator UI, shared validation logic, and automated tests."
  ],
  technicalTasks,
  tests: [
    "Payment below monthly interest returns a warning state.",
    "Zero-interest term calculation uses a simplified formula.",
    "Valid inputs render the expected rounded month count.",
    "Form validation blocks empty and negative values."
  ],
  sourceConfidence: 0.94,
  sourceType: "explicit"
};

export const demoSpec: SharedSpec = {
  workspaceId: demoWorkspace.id,
  featureName: "Loan repayment term calculator",
  businessIntent: "Help customers judge affordability earlier and reduce manual clarification from branch staff.",
  userStory: demoAnalysis.userStory,
  inputs: ["Loan amount", "Annual interest rate", "Monthly payment"],
  outputs: ["Estimated number of repayment months", "Warning state if payment is not sufficient"],
  businessRules: [
    "The calculator must explain the result in plain business language.",
    "The feature must remain inside the existing calculator experience.",
    "Warnings should prevent misleading results when inputs are not viable."
  ],
  validationRules: [
    "Loan amount must be greater than zero.",
    "Monthly payment must be greater than zero.",
    "Interest rate cannot be negative.",
    "Monthly payment must exceed monthly interest accrual to produce a term."
  ],
  errorStates: [
    "Payment too low to reduce principal.",
    "Missing required input.",
    "Non-numeric value entered."
  ],
  frontendExpectations: [
    "Reuse current calculator card structure.",
    "Show result and warnings without page refresh.",
    "Keep labels understandable for non-technical users."
  ],
  backendExpectations: [
    "Use a deterministic calculation function.",
    "Return explicit validation messages for impossible scenarios.",
    "Expose calculation details for future auditability."
  ],
  technicalTasks,
  suggestedFiles: [
    "src/components/LoanCalculatorForm.tsx",
    "src/lib/calculations/loan.ts",
    "src/lib/validation/loan.ts"
  ],
  suggestedTests: demoAnalysis.tests,
  openQuestions: ambiguities.map((item) => item.suggestedClarification),
  definitionOfDone: [
    "Users can calculate repayment term from the existing calculator.",
    "Impossible inputs show a clear warning.",
    "Business acceptance criteria map to automated tests.",
    "Product Owner summary can be copied from the PR explainer."
  ],
  approvalStatus: "needs-clarification",
  version: 3,
  updatedAt: now,
  sourceConfidence: 0.93,
  sourceType: "explicit"
};

export const demoRepoIndex: RepoIndexStatus = {
  workspaceId: demoWorkspace.id,
  repoUrl: "https://github.com/demo-bank/loan-portal",
  branch: "main",
  status: "complete",
  progress: 100,
  indexedAt: now,
  totalFiles: 27
};

export const demoRepoTree: RepoFileNode[] = [
  {
    id: createId("node"),
    path: "src/components",
    name: "components",
    type: "folder",
    category: "frontend",
    children: [
      {
        id: createId("node"),
        path: "src/components/LoanCalculatorForm.tsx",
        name: "LoanCalculatorForm.tsx",
        type: "file",
        category: "frontend",
        content:
          "export function LoanCalculatorForm() {\n  return <form>{/* Existing form for loan amount and rate. */}</form>;\n}"
      }
    ]
  },
  {
    id: createId("node"),
    path: "src/lib/calculations",
    name: "calculations",
    type: "folder",
    category: "backend",
    children: [
      {
        id: createId("node"),
        path: "src/lib/calculations/payment.ts",
        name: "payment.ts",
        type: "file",
        category: "backend",
        content:
          "export function calculateMonthlyPayment(principal: number, rate: number, months: number) {\n  return principal * rate / Math.max(months, 1);\n}"
      }
    ]
  },
  {
    id: createId("node"),
    path: "src/lib/validation/loan.test.ts",
    name: "loan.test.ts",
    type: "file",
    category: "tests",
    content:
      "describe('loan validation', () => {\n  it('rejects empty values', () => {\n    expect(true).toBe(true);\n  });\n});"
  },
  {
    id: createId("node"),
    path: "package.json",
    name: "package.json",
    type: "file",
    category: "config",
    content:
      "{\n  \"name\": \"loan-portal\",\n  \"scripts\": {\n    \"dev\": \"next dev\"\n  }\n}"
  }
];

export const demoCodebaseAnswer: CodebaseAnswer = {
  question: "Where should loan term logic be added?",
  mode: "developer",
  answer:
    "The existing calculator UI lives in LoanCalculatorForm, while calculation utilities sit in src/lib/calculations. The cleanest addition is a dedicated term calculation helper plus a new monthly payment field in the current form.",
  businessExplanation:
    "The code is already split between what customers see and the calculation rules behind it. That means the new feature can fit into the current calculator without redesigning the whole journey.",
  developerExplanation:
    "Add the input field in src/components/LoanCalculatorForm.tsx, create a term calculation utility in src/lib/calculations/loan.ts, and extend validation in src/lib/validation/loan.ts. Relevant tests should sit beside those modules.",
  relatedFiles: [
    "src/components/LoanCalculatorForm.tsx",
    "src/lib/calculations/payment.ts",
    "src/lib/validation/loan.test.ts"
  ],
  riskNotes: [
    "Existing payment helpers may assume months are already known.",
    "Validation is currently shallow and may not handle impossible payment scenarios."
  ],
  citations: [
    {
      filePath: "src/components/LoanCalculatorForm.tsx",
      lineStart: 1,
      lineEnd: 2,
      excerpt: "Existing form for loan amount and rate."
    },
    {
      filePath: "src/lib/calculations/payment.ts",
      lineStart: 1,
      lineEnd: 2,
      excerpt: "calculateMonthlyPayment(principal, rate, months)"
    }
  ],
  sourceConfidence: 0.86,
  sourceType: "inferred"
};

export const demoDiffExplanation: DiffExplanation = {
  executiveSummary:
    "The pull request adds a repayment-term calculation path to the existing loan calculator and introduces warnings for unrealistic payment values.",
  userImpact: [
    "Customers can estimate how many months repayment will take.",
    "Users are warned when their proposed monthly payment is too low."
  ],
  technicalChanges: [
    "Added a term calculation helper.",
    "Extended form validation rules.",
    "Updated the calculator UI with a new input and result card."
  ],
  businessValue: [
    "Reduces ambiguity during product comparison.",
    "Supports more informed customer decision-making before application."
  ],
  sideEffects: ["Validation copy needs product review for customer-facing language."],
  nonImplementedItems: [
    "No repayment schedule export was added.",
    "No analytics tracking was included in the diff."
  ],
  releaseNote:
    "Loan calculator customers can now estimate repayment duration using loan amount, interest rate, and monthly payment.",
  demoScript: [
    "Open the loan calculator.",
    "Enter amount, rate, and payment.",
    "Show the repayment months result.",
    "Enter a too-low payment to demonstrate the warning state."
  ],
  changedFiles: [
    "src/components/LoanCalculatorForm.tsx",
    "src/lib/calculations/loan.ts",
    "src/lib/validation/loan.ts"
  ],
  sourceConfidence: 0.91,
  sourceType: "explicit"
};

export const demoAlignment: AlignmentReport = {
  workspaceId: demoWorkspace.id,
  sourceDiff:
    "diff --git a/src/components/LoanCalculatorForm.tsx b/src/components/LoanCalculatorForm.tsx\n+ add monthly payment field\n+ render repayment term result",
  coverageScore: 84,
  fullyImplementedItems: [
    "The calculator accepts loan amount, interest rate, and monthly payment.",
    "The system returns repayment duration in months.",
    "The system warns when payment is too low."
  ],
  partiallyImplementedItems: [
    "Result wording is clear, but not yet validated with product copy review."
  ],
  missingItems: ["Automated tests for the zero-interest scenario were not detected."],
  assumptions: ["The developer assumed monthly payment excludes taxes and fees."],
  businessRisks: ["If payment definition is not clarified, customers may misread the result."],
  uxRisks: ["Result placement could be missed on smaller screens if the card sits below the fold."],
  testCoverageGaps: [
    "No evidence of regression coverage for fractional month rounding.",
    "No API-level test for impossible payment validation."
  ],
  followUpQuestions: [
    "Should monthly payment include only principal and interest?",
    "Should repayment months always round up?"
  ],
  traceability: [
    {
      criterion: "The calculator accepts loan amount, annual interest rate, and monthly payment as inputs.",
      status: "covered",
      evidence: ["LoanCalculatorForm.tsx adds a monthly payment field."],
      notes: "UI evidence found in form changes."
    },
    {
      criterion: "The system returns the estimated number of months required to repay the loan.",
      status: "covered",
      evidence: ["loan.ts computes repayment months.", "LoanCalculatorForm.tsx renders term result."],
      notes: "Business-facing result is present."
    },
    {
      criterion: "Validation errors explain how the user can correct the input.",
      status: "partial",
      evidence: ["Validation branch added for insufficient payment."],
      notes: "Detected validation logic, but copy quality needs review."
    },
    {
      criterion: "The result is displayed in plain language and remains consistent with the existing calculator design.",
      status: "missing",
      evidence: ["Not detected"],
      notes: "Diff does not provide enough evidence for design consistency."
    }
  ],
  sourceConfidence: 0.89,
  sourceType: "inferred"
};

export const demoActivity: ActivityEvent[] = [
  {
    id: createId("evt"),
    workspaceId: demoWorkspace.id,
    type: "demo",
    message: "Loaded the loan-term demo workspace.",
    timestamp: now,
    stage: "complete"
  },
  {
    id: createId("evt"),
    workspaceId: demoWorkspace.id,
    type: "analysis",
    message: "Requirement analysis generated 5 acceptance criteria and 3 ambiguity prompts.",
    timestamp: now,
    stage: "complete"
  },
  {
    id: createId("evt"),
    workspaceId: demoWorkspace.id,
    type: "repo",
    message: "Repository snapshot indexed with 27 relevant files.",
    timestamp: now,
    stage: "complete"
  },
  {
    id: createId("evt"),
    workspaceId: demoWorkspace.id,
    type: "alignment",
    message: "Alignment report produced with coverage score 84.",
    timestamp: now,
    stage: "complete"
  }
];

export const demoVoiceComments: VoiceComment[] = [
  {
    id: createId("voice"),
    ticketId: "workspace_demo_loan_term:spec",
    workspaceId: demoWorkspace.id,
    audioUrl: "/api/voice/file/demo-clarification.mp3",
    transcript: "Please confirm that monthly payment means principal and interest only before we approve the calculator changes.",
    translatedTranscript: "Please confirm that monthly payment means principal and interest only before we approve the calculator changes.",
    sourceLanguage: "en",
    targetLanguage: "en",
    summary: "Reviewer asks for payment-definition clarification before approval.",
    summaryMode: "business",
    createdBy: "Product Owner",
    createdAt: now,
    correctionRequested: true,
    correctionReason: "Payment definition is still ambiguous.",
    correctionCount: 1
  }
];

export const demoVoiceSessions: VoiceSession[] = [
  {
    id: createId("session"),
    workspaceId: demoWorkspace.id,
    transcript:
      "Analyst: We need a repayment term result. Developer: We can extend the current calculator and add validation for low monthly payments.",
    translatedTranscript:
      "Analyst: We need a repayment term result. Developer: We can extend the current calculator and add validation for low monthly payments.",
    summary: {
      decisions: ["Keep the feature inside the existing loan calculator.", "Warn when payment is too low to reduce principal."],
      openQuestions: ["Should monthly payment include taxes and fees?"],
      risks: ["Users may misunderstand the payment definition."],
      nextTasks: ["Add validation copy review.", "Confirm rounding behavior for fractional months."]
    },
    speakers: ["Analyst", "Developer"],
    startedAt: now,
    endedAt: now
  }
];

export const demoPayload: DemoWorkspacePayload = {
  workspace: demoWorkspace,
  analysis: demoAnalysis,
  spec: demoSpec,
  repoIndex: demoRepoIndex,
  repoTree: demoRepoTree,
  codebaseAnswer: demoCodebaseAnswer,
  diffExplanation: demoDiffExplanation,
  alignment: demoAlignment,
  activity: demoActivity,
  voiceComments: demoVoiceComments,
  voiceSessions: demoVoiceSessions
};
