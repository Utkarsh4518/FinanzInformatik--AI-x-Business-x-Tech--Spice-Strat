import { NextRequest } from "next/server";
import { createLiveEventStream } from "@/lib/streaming";
import { demoPayload, demoRepoIndex } from "@/lib/demo/data";
import { addActivityEvent, setRepoChunks, setRepoIndex, setRepoTree } from "@/lib/db/mock-store";
import { fetchRepositorySnapshot, validateGitHubUrl } from "@/lib/github/repository";
import type { RepoIndexRequest, RepoIndexStreamPayload } from "@/lib/types/api";
import type { RepoIndexStatus } from "@/lib/types/domain";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RepoIndexRequest;
  const stream = createLiveEventStream<RepoIndexStreamPayload>(async (send) => {
    const baseStatus: RepoIndexStatus = {
      ...demoRepoIndex,
      workspaceId: body.workspaceId,
      repoUrl: body.repoUrl,
      branch: body.branch,
      indexedAt: new Date().toISOString(),
      status: "fetching",
      progress: 10
    };

    setRepoIndex(body.workspaceId, baseStatus);
    addActivityEvent(body.workspaceId, "repo", `Repository indexing started for ${body.repoUrl}.`, "started");
    await send({ type: "repo-index", stage: "queued", message: "Repository indexing queued." });

    if (!validateGitHubUrl(body.repoUrl)) {
      const payload = {
        status: {
          ...baseStatus,
          status: "error" as const,
          progress: 100
        },
        tree: demoPayload.repoTree,
        chunks: []
      };
      await send({ type: "repo-index", stage: "error", message: "Repository URL is invalid.", progress: 100, payload });
      return;
    }

    await send({ type: "repo-index", stage: "started", message: "Fetching repository files and validating paths.", progress: 25 });
    let snapshot;
    try {
      snapshot = await fetchRepositorySnapshot(body.repoUrl, body.branch);
    } catch (error) {
      addActivityEvent(body.workspaceId, "repo", "Repository indexing fell back to demo data because the live fetch failed.", "error");
      await send({
        type: "repo-index",
        stage: "error",
        message: error instanceof Error ? error.message : "Repository fetch failed.",
        progress: 100,
        payload: {
          status: {
            ...baseStatus,
            status: "error" as const,
            progress: 100
          },
          tree: demoPayload.repoTree,
          chunks: []
        }
      });
      return;
    }
    await send({ type: "repo-index", stage: "progress", message: `Fetched ${snapshot.totalFiles} source files.`, progress: 55 });

    const status: RepoIndexStatus = {
      ...baseStatus,
      status: "complete",
      progress: 100,
      totalFiles: snapshot.totalFiles
    };

    setRepoIndex(body.workspaceId, status);
    setRepoTree(body.workspaceId, snapshot.tree);
    setRepoChunks(body.workspaceId, snapshot.chunks);
    addActivityEvent(body.workspaceId, "repo", `Repository indexed with ${snapshot.totalFiles} text files.`, "complete");
    await send({ type: "repo-index", stage: "partial", message: "Stored repository tree and semantic chunks for codebase Q&A.", progress: 85 });
    await send({
      type: "repo-index",
      stage: "complete",
      message: "Repository indexing completed.",
      progress: 100,
      payload: {
        status,
        tree: snapshot.tree,
        chunks: snapshot.chunks
      }
    });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
