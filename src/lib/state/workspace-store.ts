"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoPayload } from "@/lib/demo/data";
import type {
  ActivityEvent,
  AlignmentReport,
  CodebaseAnswer,
  DiffExplanation,
  RepoFileNode,
  RepoIndexStatus,
  RequirementAnalysis,
  RoleMode,
  SharedSpec,
  VoiceComment,
  VoicePlaybackAsset,
  VoiceSession,
  Workspace
} from "@/lib/types/domain";

type WorkspaceState = {
  activeWorkspace: Workspace;
  analysis: RequirementAnalysis | null;
  spec: SharedSpec | null;
  repoIndex: RepoIndexStatus | null;
  repoTree: RepoFileNode[];
  selectedFilePath?: string;
  codebaseAnswer: CodebaseAnswer | null;
  diffExplanation: DiffExplanation | null;
  alignment: AlignmentReport | null;
  activity: ActivityEvent[];
  voiceComments: VoiceComment[];
  voiceSessions: VoiceSession[];
  playbackAssets: Record<string, VoicePlaybackAsset>;
  roleMode: RoleMode;
  simpleWording: boolean;
  setWorkspace: (workspace: Workspace) => void;
  setAnalysis: (analysis: RequirementAnalysis | null) => void;
  setSpec: (spec: SharedSpec | null) => void;
  setRepoIndex: (repoIndex: RepoIndexStatus | null) => void;
  setRepoTree: (repoTree: RepoFileNode[]) => void;
  setSelectedFilePath: (selectedFilePath?: string) => void;
  setCodebaseAnswer: (answer: CodebaseAnswer | null) => void;
  setDiffExplanation: (explanation: DiffExplanation | null) => void;
  setAlignment: (alignment: AlignmentReport | null) => void;
  setActivity: (activity: ActivityEvent[]) => void;
  setVoiceComments: (voiceComments: VoiceComment[]) => void;
  addVoiceComment: (voiceComment: VoiceComment) => void;
  setVoiceSessions: (voiceSessions: VoiceSession[]) => void;
  addVoiceSession: (voiceSession: VoiceSession) => void;
  setPlaybackAsset: (key: string, playback: VoicePlaybackAsset) => void;
  addActivity: (event: ActivityEvent) => void;
  setRoleMode: (roleMode: RoleMode) => void;
  setSimpleWording: (simpleWording: boolean) => void;
  loadDemo: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: demoPayload.workspace,
      analysis: demoPayload.analysis,
      spec: demoPayload.spec,
      repoIndex: demoPayload.repoIndex,
      repoTree: demoPayload.repoTree,
      selectedFilePath: demoPayload.repoTree[0]?.children?.[0]?.path,
      codebaseAnswer: demoPayload.codebaseAnswer,
      diffExplanation: demoPayload.diffExplanation,
      alignment: demoPayload.alignment,
      activity: demoPayload.activity,
      voiceComments: demoPayload.voiceComments,
      voiceSessions: demoPayload.voiceSessions,
      playbackAssets: {},
      roleMode: demoPayload.workspace.roleMode,
      simpleWording: true,
      setWorkspace: (activeWorkspace) => set({ activeWorkspace }),
      setAnalysis: (analysis) => set({ analysis }),
      setSpec: (spec) => set({ spec }),
      setRepoIndex: (repoIndex) => set({ repoIndex }),
      setRepoTree: (repoTree) => set({ repoTree }),
      setSelectedFilePath: (selectedFilePath) => set({ selectedFilePath }),
      setCodebaseAnswer: (codebaseAnswer) => set({ codebaseAnswer }),
      setDiffExplanation: (diffExplanation) => set({ diffExplanation }),
      setAlignment: (alignment) => set({ alignment }),
      setActivity: (activity) => set({ activity }),
      setVoiceComments: (voiceComments) => set({ voiceComments }),
      addVoiceComment: (voiceComment) =>
        set((state) => ({
          voiceComments: [voiceComment, ...state.voiceComments],
          activeWorkspace: {
            ...state.activeWorkspace,
            correctionCount: voiceComment.correctionRequested
              ? (state.activeWorkspace.correctionCount ?? 0) + 1
              : state.activeWorkspace.correctionCount ?? 0,
            lastVoiceCommentAt: voiceComment.createdAt,
            lastVoiceCommentBy: voiceComment.createdBy,
            updatedAt: voiceComment.createdAt
          }
        })),
      setVoiceSessions: (voiceSessions) => set({ voiceSessions }),
      addVoiceSession: (voiceSession) => set((state) => ({ voiceSessions: [voiceSession, ...state.voiceSessions] })),
      setPlaybackAsset: (key, playback) =>
        set((state) => ({
          playbackAssets: {
            ...state.playbackAssets,
            [key]: playback
          }
        })),
      addActivity: (event) => set((state) => ({ activity: [event, ...state.activity] })),
      setRoleMode: (roleMode) =>
        set((state) => ({
          roleMode,
          activeWorkspace: {
            ...state.activeWorkspace,
            roleMode,
            updatedAt: new Date().toISOString()
          }
        })),
      setSimpleWording: (simpleWording) => set({ simpleWording }),
      loadDemo: () =>
        set({
          activeWorkspace: demoPayload.workspace,
          analysis: demoPayload.analysis,
          spec: demoPayload.spec,
          repoIndex: demoPayload.repoIndex,
          repoTree: demoPayload.repoTree,
          selectedFilePath: demoPayload.repoTree[0]?.children?.[0]?.path,
          codebaseAnswer: demoPayload.codebaseAnswer,
          diffExplanation: demoPayload.diffExplanation,
          alignment: demoPayload.alignment,
          activity: demoPayload.activity,
          voiceComments: demoPayload.voiceComments,
          voiceSessions: demoPayload.voiceSessions,
          playbackAssets: {},
          roleMode: demoPayload.workspace.roleMode
        })
    }),
    {
      name: "specbridge-workspace"
    }
  )
);
