import { demoPayload } from "@/lib/demo/data";
import { getAIProvider } from "@/lib/ai/factory";
import { createId } from "@/lib/utils";
import type { RepoChunk, RepoFileNode } from "@/lib/types/domain";

const ignoredExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".lock",
  ".mp4",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot"
];

function getGitHubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: getGitHubHeaders(),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function fetchGitHubText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: getGitHubHeaders(),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`GitHub text fetch failed with status ${response.status}.`);
  }

  return response.text();
}

export function validateGitHubUrl(url: string) {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(url.trim());
}

export function parseGitHubUrl(url: string) {
  const match = url.trim().match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, "")
  };
}

export function chunkText(text: string, size = 320) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

export function flattenRepoTree(nodes: RepoFileNode[]): RepoFileNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenRepoTree(node.children) : [])]);
}

export function getDemoRepoSnapshot() {
  return demoPayload.repoTree;
}

export function inferFileCategory(path: string): RepoFileNode["category"] {
  if (path.includes(".test.") || path.includes("__tests__")) {
    return "tests";
  }
  if (path.endsWith(".json") || path.endsWith(".config.ts") || path.endsWith(".config.js") || path.endsWith(".md")) {
    return "config";
  }
  if (path.includes("/app/") || path.includes("/api/") || path.includes("/lib/") || path.includes("/server/")) {
    return "backend";
  }
  return "frontend";
}

export function buildRepoNode(path: string, content?: string): RepoFileNode {
  const segments = path.split("/");
  const name = segments[segments.length - 1] || path;
  return {
    id: createId("node"),
    path,
    name,
    type: "file",
    category: inferFileCategory(path),
    content
  };
}

function shouldIndexPath(path: string, size?: number) {
  if (size && size > 120_000) {
    return false;
  }

  const lowered = path.toLowerCase();
  return !ignoredExtensions.some((extension) => lowered.endsWith(extension));
}

function insertNode(root: RepoFileNode[], fileNode: RepoFileNode) {
  const segments = fileNode.path.split("/");
  let current = root;
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const isLeaf = index === segments.length - 1;
    const existing = current.find((node) => node.name === segment && node.path === currentPath);

    if (isLeaf) {
      if (!existing) {
        current.push(fileNode);
      }
      return;
    }

    if (!existing) {
      const folder: RepoFileNode = {
        id: createId("node"),
        path: currentPath,
        name: segment,
        type: "folder",
        category: inferFileCategory(currentPath),
        children: []
      };
      current.push(folder);
      current = folder.children!;
    } else {
      current = existing.children ?? [];
      existing.children = current;
    }
  });
}

function buildTreeFromFiles(files: Array<{ path: string; content: string }>) {
  const root: RepoFileNode[] = [];
  files.forEach((file) => insertNode(root, buildRepoNode(file.path, file.content)));
  return root;
}

export async function createRepoChunks(files: Array<{ path: string; content: string }>) {
  const provider = getAIProvider();
  const chunks: RepoChunk[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");
    const chunkContents = chunkText(file.content, 500);
    let consumedLines = 0;

    for (const content of chunkContents) {
      const lineCount = content.split("\n").length;
      chunks.push({
        id: createId("chunk"),
        path: file.path,
        category: inferFileCategory(file.path),
        content,
        startLine: consumedLines + 1,
        endLine: consumedLines + lineCount,
        embedding: await provider.embed(`${file.path}\n${content}`)
      });
      consumedLines += lineCount;
      if (consumedLines > lines.length) {
        consumedLines = lines.length;
      }
    }
  }

  return chunks;
}

export async function fetchRepositorySnapshot(repoUrl: string, branch: string) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      tree: demoPayload.repoTree,
      chunks: [] as RepoChunk[],
      totalFiles: demoPayload.repoIndex.totalFiles ?? 0
    };
  }

  const treeResponse = await fetchGitHubJson<{
    tree: Array<{ path: string; type: string; size?: number }>;
  }>(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`);

  const candidateFiles = treeResponse.tree
    .filter((entry) => entry.type === "blob" && shouldIndexPath(entry.path, entry.size))
    .slice(0, 40);

  if (candidateFiles.length === 0) {
    return {
      tree: demoPayload.repoTree,
      chunks: [] as RepoChunk[],
      totalFiles: 0
    };
  }

  const files = await Promise.all(
    candidateFiles.map(async (entry) => ({
      path: entry.path,
      content: await fetchGitHubText(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${entry.path}`)
    }))
  );

  const tree = buildTreeFromFiles(files);
  const chunks = await createRepoChunks(files);

  return {
    tree,
    chunks,
    totalFiles: files.length
  };
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export async function rankRepoChunks(question: string, chunks: RepoChunk[]) {
  const provider = getAIProvider();
  const questionEmbedding = await provider.embed(question);
  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding ?? [])
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((item) => item.chunk);
}
