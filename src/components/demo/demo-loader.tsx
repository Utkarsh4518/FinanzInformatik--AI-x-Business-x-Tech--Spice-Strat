"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import type { DemoWorkspacePayload } from "@/lib/types/domain";

export function DemoLoader() {
  const router = useRouter();
  const loadDemo = useWorkspaceStore((state) => state.loadDemo);
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const setAnalysis = useWorkspaceStore((state) => state.setAnalysis);
  const setSpec = useWorkspaceStore((state) => state.setSpec);
  const setRepoIndex = useWorkspaceStore((state) => state.setRepoIndex);
  const setRepoTree = useWorkspaceStore((state) => state.setRepoTree);
  const setCodebaseAnswer = useWorkspaceStore((state) => state.setCodebaseAnswer);
  const setDiffExplanation = useWorkspaceStore((state) => state.setDiffExplanation);
  const setAlignment = useWorkspaceStore((state) => state.setAlignment);
  const setActivity = useWorkspaceStore((state) => state.setActivity);
  const setVoiceComments = useWorkspaceStore((state) => state.setVoiceComments);
  const setVoiceSessions = useWorkspaceStore((state) => state.setVoiceSessions);
  const pushToast = useUIStore((state) => state.pushToast);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/demo/load", { method: "POST" });
      return (await response.json()) as { demo: DemoWorkspacePayload };
    },
    onSuccess: ({ demo }) => {
      loadDemo();
      setWorkspace(demo.workspace);
      setAnalysis(demo.analysis);
      setSpec(demo.spec);
      setRepoIndex(demo.repoIndex);
      setRepoTree(demo.repoTree);
      setCodebaseAnswer(demo.codebaseAnswer);
      setDiffExplanation(demo.diffExplanation);
      setAlignment(demo.alignment);
      setActivity(demo.activity);
      setVoiceComments(demo.voiceComments);
      setVoiceSessions(demo.voiceSessions);
      pushToast({ title: "Demo loaded", description: "The full SpecBridge walkthrough is ready.", variant: "success" });
      router.push("/workspace");
    }
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Demo Mode</p>
          <h3 className="mt-2 text-xl font-semibold text-text">Load the complete loan-term scenario</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-muted">
          Seed a fully connected workspace with requirement analysis, clarifications, repo snapshot, PR diff summary, and alignment report.
        </p>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Load demo scenario
        </Button>
      </CardContent>
    </Card>
  );
}
