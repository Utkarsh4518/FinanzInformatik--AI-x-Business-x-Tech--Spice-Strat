export type RoleMode = "business" | "developer" | "reviewer";

export type StreamingStage = "queued" | "started" | "progress" | "partial" | "complete" | "error";

export type ApprovalStatus = "draft" | "approved" | "needs-clarification";

export type Severity = "low" | "medium" | "high";

export type TraceabilityStatus = "covered" | "partial" | "missing";

export type SourceCertainty = "explicit" | "inferred";

export interface EvidenceRef {
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  excerpt?: string;
}

export interface ConfidenceMeta {
  sourceConfidence?: number;
  sourceType?: SourceCertainty;
  evidence?: EvidenceRef[];
}

export interface RequirementMetadata {
  businessGoal?: string;
  successMetric?: string;
  deadline?: string;
  priority?: string;
  userType?: string;
  frontendExpectations?: string;
  constraints?: string;
}

export interface Workspace {
  id: string;
  title: string;
  roleMode: RoleMode;
  requirementText: string;
  metadata: RequirementMetadata;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "active" | "archived";
  isDemo?: boolean;
  correctionCount?: number;
  lastVoiceCommentAt?: string;
  lastVoiceCommentBy?: string;
}

export interface AmbiguityFinding extends ConfidenceMeta {
  id: string;
  phrase: string;
  severity: Severity;
  whyItMatters: string;
  suggestedClarification: string;
  status: "open" | "accepted" | "rejected" | "edited";
  response?: string;
}

export interface TechnicalTask extends ConfidenceMeta {
  id: string;
  title: string;
  description: string;
  owner: "frontend" | "backend" | "qa" | "full-stack";
  files: string[];
  tests: string[];
  status: "todo" | "in-progress" | "done";
}

export interface RequirementAnalysis extends ConfidenceMeta {
  summary: string;
  userStory: string;
  acceptanceCriteria: string[];
  ambiguities: AmbiguityFinding[];
  edgeCases: string[];
  outOfScope: string[];
  uiSuggestions: string[];
  technicalImpactSummary: string[];
  technicalTasks: TechnicalTask[];
  tests: string[];
}

export interface SharedSpec extends ConfidenceMeta {
  workspaceId: string;
  featureName: string;
  businessIntent: string;
  userStory: string;
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  validationRules: string[];
  errorStates: string[];
  frontendExpectations: string[];
  backendExpectations: string[];
  technicalTasks: TechnicalTask[];
  suggestedFiles: string[];
  suggestedTests: string[];
  openQuestions: string[];
  definitionOfDone: string[];
  approvalStatus: ApprovalStatus;
  version: number;
  updatedAt: string;
}

export interface RepoFileNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  category: "frontend" | "backend" | "tests" | "config";
  content?: string;
  children?: RepoFileNode[];
}

export interface RepoChunk {
  id: string;
  path: string;
  category: RepoFileNode["category"];
  content: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export interface RepoIndexStatus {
  workspaceId: string;
  repoUrl: string;
  branch: string;
  status: "idle" | "fetching" | "indexing" | "embedding" | "complete" | "error";
  progress: number;
  indexedAt?: string;
  totalFiles?: number;
}

export interface CodebaseAnswer extends ConfidenceMeta {
  question: string;
  mode: RoleMode;
  answer: string;
  businessExplanation: string;
  developerExplanation: string;
  relatedFiles: string[];
  riskNotes: string[];
  citations: EvidenceRef[];
}

export interface DiffExplanation extends ConfidenceMeta {
  executiveSummary: string;
  userImpact: string[];
  technicalChanges: string[];
  businessValue: string[];
  sideEffects: string[];
  nonImplementedItems: string[];
  releaseNote: string;
  demoScript: string[];
  changedFiles: string[];
}

export interface TraceabilityRow {
  criterion: string;
  status: TraceabilityStatus;
  evidence: string[];
  notes: string;
}

export interface AlignmentReport extends ConfidenceMeta {
  workspaceId: string;
  sourceDiff: string;
  coverageScore: number;
  fullyImplementedItems: string[];
  partiallyImplementedItems: string[];
  missingItems: string[];
  assumptions: string[];
  businessRisks: string[];
  uxRisks: string[];
  testCoverageGaps: string[];
  followUpQuestions: string[];
  traceability: TraceabilityRow[];
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  type: "analysis" | "spec" | "repo" | "alignment" | "diff" | "settings" | "demo" | "system" | "voice";
  message: string;
  timestamp: string;
  stage?: StreamingStage;
}

export type VoiceSummaryMode = "business" | "developer";

export interface VoiceComment {
  id: string;
  ticketId: string;
  workspaceId: string;
  audioUrl: string;
  transcript: string;
  translatedTranscript?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  summary: string;
  summaryMode: VoiceSummaryMode;
  createdBy: string;
  createdAt: string;
  correctionRequested?: boolean;
  correctionReason?: string;
  correctionCount?: number;
}

export interface VoiceSession {
  id: string;
  workspaceId: string;
  transcript: string;
  translatedTranscript?: string;
  summary: {
    decisions: string[];
    openQuestions: string[];
    risks: string[];
    nextTasks: string[];
  };
  speakers: string[];
  startedAt: string;
  endedAt: string;
}

export interface VoiceTranscription {
  transcript: string;
  translatedTranscript?: string;
  detectedLanguage?: string;
  timestamps: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  speakers: string[];
  audioUrl?: string;
}

export interface VoicePlaybackAsset {
  audioUrl: string;
  text: string;
  quality: "fast" | "high";
  voiceId?: string;
}

export interface ConnectionTestResult {
  provider: string;
  status: "success" | "warning" | "error";
  message: string;
  latencyMs?: number;
}

export interface DemoWorkspacePayload {
  workspace: Workspace;
  analysis: RequirementAnalysis;
  spec: SharedSpec;
  repoIndex: RepoIndexStatus;
  repoTree: RepoFileNode[];
  codebaseAnswer: CodebaseAnswer;
  diffExplanation: DiffExplanation;
  alignment: AlignmentReport;
  activity: ActivityEvent[];
  voiceComments: VoiceComment[];
  voiceSessions: VoiceSession[];
}

export interface ConnectionCardState {
  id: string;
  title: string;
  provider: string;
  description: string;
  configured: boolean;
  status: "connected" | "missing" | "warning";
  envKeys: string[];
}
