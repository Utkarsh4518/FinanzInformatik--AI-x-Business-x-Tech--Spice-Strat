import type {
  ActivityEvent,
  AlignmentReport,
  CodebaseAnswer,
  ConnectionTestResult,
  DemoWorkspacePayload,
  DiffExplanation,
  RepoChunk,
  RepoIndexStatus,
  RepoFileNode,
  RequirementAnalysis,
  RequirementMetadata,
  RoleMode,
  SharedSpec,
  VoiceComment,
  VoicePlaybackAsset,
  VoiceSession,
  VoiceTranscription
} from "@/lib/types/domain";

export interface StreamingEvent<T = unknown> {
  type: string;
  stage: "queued" | "started" | "progress" | "partial" | "complete" | "error";
  message: string;
  progress?: number;
  payload?: T;
  error?: string;
}

export interface AnalyzeRequirementRequest {
  workspaceId: string;
  requirementText: string;
  metadata: RequirementMetadata;
  wordingMode: "simple" | "technical";
  roleMode: RoleMode;
}

export interface ClarifyRequirementRequest {
  workspaceId: string;
  requirementText: string;
}

export interface GenerateSpecRequest {
  workspaceId: string;
  title: string;
  analysis: RequirementAnalysis;
  metadata: RequirementMetadata;
}

export interface RepoIndexRequest {
  workspaceId: string;
  repoUrl: string;
  branch: string;
}

export interface RepoAskRequest {
  workspaceId: string;
  question: string;
  mode: RoleMode;
  selectedFile?: string;
}

export interface DiffExplainRequest {
  workspaceId: string;
  prUrl?: string;
  rawDiff?: string;
  commitRange?: string;
  roleMode: RoleMode;
}

export interface AlignmentCheckRequest {
  workspaceId: string;
  spec: SharedSpec;
  diffText: string;
}

export interface TestConnectionRequest {
  provider: string;
  config?: Record<string, string>;
}

export interface VoiceTranslateRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  summaryMode?: "business" | "developer";
}

export interface VoiceSpeakRequest {
  text: string;
  quality?: "fast" | "high";
  voiceId?: string;
}

export interface VoiceCommentRequest {
  ticketId: string;
  workspaceId: string;
  audioUrl: string;
  transcript: string;
  translatedTranscript?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  createdBy: string;
  summaryMode?: "business" | "developer";
  correctionRequested?: boolean;
  correctionReason?: string;
}

export interface VoiceHistoryResponse {
  ticketId: string;
  comments: VoiceComment[];
}

export interface VoiceCommentResponse {
  comment: VoiceComment;
}

export interface VoiceTranslateResponse {
  originalText: string;
  translatedText: string;
  rewrittenText: string;
}

export interface VoiceSpeakResponse {
  playback: VoicePlaybackAsset;
}

export interface VoiceTranscribeResponse {
  transcription: VoiceTranscription;
  analysis?: RequirementAnalysis;
  spec?: SharedSpec;
  voiceSession?: VoiceSession;
}

export interface VoiceDubResponse {
  dubbingId?: string;
  status: "queued" | "processing" | "complete" | "error";
  message: string;
  audioUrl?: string;
}

export interface ActivityResponse {
  workspaceId: string;
  events: ActivityEvent[];
}

export interface RepoIndexResponse {
  status: RepoIndexStatus;
}

export interface RepoIndexStreamPayload {
  status: RepoIndexStatus;
  tree: RepoFileNode[];
  chunks?: RepoChunk[];
}

export interface DemoLoadResponse {
  demo: DemoWorkspacePayload;
}

export interface AnalyzeRequirementResponse {
  analysis: RequirementAnalysis;
}

export interface GenerateSpecResponse {
  spec: SharedSpec;
}

export interface RepoAskResponse {
  answer: CodebaseAnswer;
}

export interface DiffExplainResponse {
  explanation: DiffExplanation;
}

export interface AlignmentCheckResponse {
  report: AlignmentReport;
}

export interface TestConnectionResponse {
  result: ConnectionTestResult;
}
