import { NextRequest, NextResponse } from "next/server";
import { addActivityEvent, getRepoChunks } from "@/lib/db/mock-store";
import { generateCodebaseAnswer } from "@/lib/analysis";
import { rankRepoChunks } from "@/lib/github/repository";
import type { RepoAskRequest } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RepoAskRequest;
  const chunks = getRepoChunks(body.workspaceId);
  const rankedChunks = await rankRepoChunks(body.question, chunks);
  const context = rankedChunks
    .map(
      (chunk) =>
        `${chunk.path}:${chunk.startLine}-${chunk.endLine}\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  const answer = await generateCodebaseAnswer({
    question: body.question,
    mode: body.mode,
    selectedFile: body.selectedFile,
    context
  });

  const citations = rankedChunks.map((chunk) => ({
    filePath: chunk.path,
    lineStart: chunk.startLine,
    lineEnd: chunk.endLine,
    excerpt: chunk.content.slice(0, 180)
  }));
  addActivityEvent(body.workspaceId, "repo", `Codebase question answered in ${body.mode} mode: ${body.question}`, "complete");

  return NextResponse.json({
    answer: {
      ...answer,
      relatedFiles: answer.relatedFiles.length > 0 ? answer.relatedFiles : rankedChunks.map((chunk) => chunk.path),
      citations
    }
  });
}
