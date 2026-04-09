import { demoPayload } from "@/lib/demo/data";
import { createId } from "@/lib/utils";
import type {
  ActivityEvent,
  AlignmentReport,
  DemoWorkspacePayload,
  DiffExplanation,
  RepoChunk,
  RepoFileNode,
  RepoIndexStatus,
  RequirementAnalysis,
  SharedSpec,
  VoiceComment,
  VoiceSession,
  Workspace
} from "@/lib/types/domain";

type StoreState = {
  workspaces: Map<string, Workspace>;
  analyses: Map<string, RequirementAnalysis>;
  specs: Map<string, SharedSpec>;
  repoIndexes: Map<string, RepoIndexStatus>;
  repoTrees: Map<string, RepoFileNode[]>;
  repoChunks: Map<string, RepoChunk[]>;
  alignments: Map<string, AlignmentReport>;
  diffExplanations: Map<string, DiffExplanation>;
  voiceComments: Map<string, VoiceComment[]>;
  voiceSessions: Map<string, VoiceSession[]>;
  activity: Map<string, ActivityEvent[]>;
};

const globalKey = "__specbridge_store__";

function createInitialState(): StoreState {
  return {
    workspaces: new Map([[demoPayload.workspace.id, demoPayload.workspace]]),
    analyses: new Map([[demoPayload.workspace.id, demoPayload.analysis]]),
    specs: new Map([[demoPayload.workspace.id, demoPayload.spec]]),
    repoIndexes: new Map([[demoPayload.workspace.id, demoPayload.repoIndex]]),
    repoTrees: new Map([[demoPayload.workspace.id, demoPayload.repoTree]]),
    repoChunks: new Map(),
    alignments: new Map([[demoPayload.workspace.id, demoPayload.alignment]]),
    diffExplanations: new Map([[demoPayload.workspace.id, demoPayload.diffExplanation]]),
    voiceComments: new Map([["workspace_demo_loan_term:spec", demoPayload.voiceComments]]),
    voiceSessions: new Map([[demoPayload.workspace.id, demoPayload.voiceSessions]]),
    activity: new Map([[demoPayload.workspace.id, demoPayload.activity]])
  };
}

function getStore(): StoreState {
  const scope = globalThis as typeof globalThis & Record<string, StoreState | undefined>;
  if (!scope[globalKey]) {
    scope[globalKey] = createInitialState();
  }

  return scope[globalKey]!;
}

export function getWorkspace(workspaceId: string) {
  return getStore().workspaces.get(workspaceId);
}

export function listWorkspaces() {
  return [...getStore().workspaces.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertWorkspace(workspace: Workspace) {
  getStore().workspaces.set(workspace.id, workspace);
}

export function setAnalysis(workspaceId: string, analysis: RequirementAnalysis) {
  getStore().analyses.set(workspaceId, analysis);
}

export function getAnalysis(workspaceId: string) {
  return getStore().analyses.get(workspaceId);
}

export function setSpec(workspaceId: string, spec: SharedSpec) {
  getStore().specs.set(workspaceId, spec);
}

export function getSpec(workspaceId: string) {
  return getStore().specs.get(workspaceId);
}

export function setRepoIndex(workspaceId: string, status: RepoIndexStatus) {
  getStore().repoIndexes.set(workspaceId, status);
}

export function getRepoIndex(workspaceId: string) {
  return getStore().repoIndexes.get(workspaceId);
}

export function setRepoTree(workspaceId: string, tree: RepoFileNode[]) {
  getStore().repoTrees.set(workspaceId, tree);
}

export function getRepoTree(workspaceId: string) {
  return getStore().repoTrees.get(workspaceId) ?? [];
}

export function setRepoChunks(workspaceId: string, chunks: RepoChunk[]) {
  getStore().repoChunks.set(workspaceId, chunks);
}

export function getRepoChunks(workspaceId: string) {
  return getStore().repoChunks.get(workspaceId) ?? [];
}

export function setAlignment(workspaceId: string, report: AlignmentReport) {
  getStore().alignments.set(workspaceId, report);
}

export function getAlignment(workspaceId: string) {
  return getStore().alignments.get(workspaceId);
}

export function setDiffExplanation(workspaceId: string, explanation: DiffExplanation) {
  getStore().diffExplanations.set(workspaceId, explanation);
}

export function getDiffExplanation(workspaceId: string) {
  return getStore().diffExplanations.get(workspaceId);
}

export function addVoiceComment(comment: VoiceComment) {
  const comments = getStore().voiceComments.get(comment.ticketId) ?? [];
  getStore().voiceComments.set(comment.ticketId, [comment, ...comments]);

  const workspace = getStore().workspaces.get(comment.workspaceId);
  if (workspace) {
    getStore().workspaces.set(comment.workspaceId, {
      ...workspace,
      correctionCount: comment.correctionRequested ? (workspace.correctionCount ?? 0) + 1 : workspace.correctionCount ?? 0,
      lastVoiceCommentAt: comment.createdAt,
      lastVoiceCommentBy: comment.createdBy,
      updatedAt: comment.createdAt
    });
  }
}

export function getVoiceComments(ticketId: string) {
  return getStore().voiceComments.get(ticketId) ?? [];
}

export function addVoiceSession(session: VoiceSession) {
  const sessions = getStore().voiceSessions.get(session.workspaceId) ?? [];
  getStore().voiceSessions.set(session.workspaceId, [session, ...sessions]);
}

export function getVoiceSessions(workspaceId: string) {
  return getStore().voiceSessions.get(workspaceId) ?? [];
}

export function addActivityEvent(
  workspaceId: string,
  type: ActivityEvent["type"],
  message: string,
  stage?: ActivityEvent["stage"]
) {
  const existing = getStore().activity.get(workspaceId) ?? [];
  const nextEvent: ActivityEvent = {
    id: createId("evt"),
    workspaceId,
    type,
    message,
    timestamp: new Date().toISOString(),
    stage
  };

  getStore().activity.set(workspaceId, [nextEvent, ...existing]);
  return nextEvent;
}

export function getActivity(workspaceId: string) {
  return getStore().activity.get(workspaceId) ?? [];
}

export function loadDemoWorkspace(): DemoWorkspacePayload {
  const store = getStore();
  store.workspaces.set(demoPayload.workspace.id, {
    ...demoPayload.workspace,
    updatedAt: new Date().toISOString()
  });
  store.analyses.set(demoPayload.workspace.id, demoPayload.analysis);
  store.specs.set(demoPayload.workspace.id, demoPayload.spec);
  store.repoIndexes.set(demoPayload.workspace.id, demoPayload.repoIndex);
  store.repoTrees.set(demoPayload.workspace.id, demoPayload.repoTree);
  store.alignments.set(demoPayload.workspace.id, demoPayload.alignment);
  store.diffExplanations.set(demoPayload.workspace.id, demoPayload.diffExplanation);
  store.voiceComments.set("workspace_demo_loan_term:spec", demoPayload.voiceComments);
  store.voiceSessions.set(demoPayload.workspace.id, demoPayload.voiceSessions);
  store.activity.set(demoPayload.workspace.id, demoPayload.activity);

  addActivityEvent(demoPayload.workspace.id, "demo", "Demo workspace refreshed and ready.", "complete");

  return demoPayload;
}
