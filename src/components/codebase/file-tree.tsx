"use client";

import { Folder, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepoFileNode } from "@/lib/types/domain";

function TreeNode({
  node,
  selectedFile,
  onSelect
}: {
  node: RepoFileNode;
  selectedFile?: string;
  onSelect: (path: string) => void;
}) {
  if (node.type === "folder") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Folder className="size-4 text-primary" />
          {node.name}
        </div>
        <div className="ml-5 space-y-2 border-l border-border pl-4">
          {node.children?.map((child) => (
            <TreeNode key={child.id} node={child} selectedFile={selectedFile} onSelect={onSelect} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      className={cn(
        "focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        selectedFile === node.path ? "bg-primary text-white" : "text-text-muted hover:bg-muted-surface hover:text-text"
      )}
    >
      <FileCode2 className="size-4" />
      {node.name}
    </button>
  );
}

export function FileTree({
  nodes,
  selectedFile,
  onSelect
}: {
  nodes: RepoFileNode[];
  selectedFile?: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} selectedFile={selectedFile} onSelect={onSelect} />
      ))}
    </div>
  );
}
