"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { consumeEventStream } from "@/lib/client/stream";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TogglePill } from "@/components/ui/toggle-pill";
import { FileTree } from "@/components/codebase/file-tree";
import { CodePreview } from "@/components/codebase/code-preview";
import { BusinessExplanationPanel } from "@/components/codebase/business-explanation-panel";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import type { RepoIndexStreamPayload } from "@/lib/types/api";
import type { CodebaseAnswer, RepoFileNode } from "@/lib/types/domain";

function findNode(nodes: RepoFileNode[], path?: string): RepoFileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const child = findNode(node.children, path);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

export default function CodebasePage() {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const repoTree = useWorkspaceStore((state) => state.repoTree);
  const selectedFile = useWorkspaceStore((state) => state.selectedFilePath);
  const setSelectedFilePath = useWorkspaceStore((state) => state.setSelectedFilePath);
  const codebaseAnswer = useWorkspaceStore((state) => state.codebaseAnswer);
  const roleMode = useWorkspaceStore((state) => state.roleMode);
  const setCodebaseAnswer = useWorkspaceStore((state) => state.setCodebaseAnswer);
  const setRepoIndex = useWorkspaceStore((state) => state.setRepoIndex);
  const setRepoTree = useWorkspaceStore((state) => state.setRepoTree);
  const pushToast = useUIStore((state) => state.pushToast);
  const [repoUrl, setRepoUrl] = useState("https://github.com/demo-bank/loan-portal");
  const [branch, setBranch] = useState("main");
  const [question, setQuestion] = useState("Where should loan term logic be added?");
  const [filter, setFilter] = useState<RepoFileNode["category"] | "all">("all");
  const [streamState, setStreamState] = useState<string[]>([]);

  const filteredTree = useMemo(() => {
    if (filter === "all") {
      return repoTree;
    }
    return repoTree
      .map((node) => {
        if (node.type === "folder") {
          const children = node.children?.filter((child) => child.category === filter);
          if (children && children.length > 0) {
            return { ...node, children };
          }
        }
        return node.category === filter ? node : null;
      })
      .filter(Boolean) as RepoFileNode[];
  }, [filter, repoTree]);

  const indexMutation = useMutation({
    mutationFn: async () => {
      setStreamState([]);
      const response = await fetch("/api/repo/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, repoUrl, branch })
      });
      await consumeEventStream<RepoIndexStreamPayload>(response, (event) => {
        setStreamState((current) => [...current, event.message]);
        if (event.stage === "complete" && event.payload) {
          setRepoIndex(event.payload.status);
          setRepoTree(event.payload.tree);
          pushToast({ title: "Repository indexed", description: "Explorer is ready for Q&A.", variant: "success" });
        }
        if (event.stage === "error") {
          pushToast({ title: "Repository indexing failed", description: event.message, variant: "danger" });
        }
      });
    },
    onError: (error) => {
      pushToast({ title: "Repository indexing failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/repo/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          question,
          mode: roleMode,
          selectedFile
        })
      });
      return (await response.json()) as { answer: CodebaseAnswer };
    },
    onSuccess: ({ answer }) => {
      setCodebaseAnswer(answer);
      pushToast({ title: "Codebase answer ready", description: "Relevant files and explanations were updated.", variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Codebase question failed", description: error instanceof Error ? error.message : "Unknown error", variant: "danger" });
    }
  });

  const selectedNode = findNode(repoTree, selectedFile);

  return (
    <AppShell title="Codebase Explorer">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Codebase Explorer" }]} />
      <div className="space-y-5">
        <Card>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <Input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="GitHub repository URL" />
            <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="Branch" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => indexMutation.mutate()} disabled={indexMutation.isPending}>
                Index Repository
              </Button>
              <Button variant="secondary" onClick={() => indexMutation.mutate()} disabled={indexMutation.isPending}>
                Refresh Index
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <Card className="h-full">
            <CardHeader>
              <div>
                <p className="section-title">Repository Files</p>
                <h3 className="mt-2 text-lg font-semibold text-text">File tree</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {["all", "frontend", "backend", "tests", "config"].map((item) => (
                  <TogglePill key={item} active={filter === item} onClick={() => setFilter(item as typeof filter)}>
                    {item}
                  </TogglePill>
                ))}
              </div>
              <FileTree nodes={filteredTree} selectedFile={selectedFile} onSelect={setSelectedFilePath} />
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-3 p-5">
                <Select
                  value={question}
                  onChange={setQuestion}
                  options={[
                    { label: "Where is loan calculation implemented?", value: "Where is loan calculation implemented?" },
                    { label: "Which files control the UI?", value: "Which files control the UI?" },
                    { label: "Where should loan term logic be added?", value: "Where should loan term logic be added?" },
                    { label: "What validations already exist?", value: "What validations already exist?" },
                    { label: "Which test files are relevant?", value: "Which test files are relevant?" }
                  ]}
                />
                <div className="flex gap-2">
                  <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask the codebase" />
                  <Button onClick={() => askMutation.mutate()} disabled={askMutation.isPending}>
                    Ask
                  </Button>
                </div>
                {streamState.length > 0 ? (
                  <div className="rounded-xl border border-border/70 bg-muted-surface p-3">
                    {streamState.map((item) => (
                      <p key={item} className="text-sm text-text">
                        {item}
                      </p>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <CodePreview filePath={selectedNode?.path} content={selectedNode?.content} />
          </div>

          <BusinessExplanationPanel answer={codebaseAnswer} />
        </div>
      </div>
    </AppShell>
  );
}
