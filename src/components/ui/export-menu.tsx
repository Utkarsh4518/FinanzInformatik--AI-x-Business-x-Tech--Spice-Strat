"use client";

import { Download, FileText, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportMenu({
  onMarkdown,
  onPdf,
  onGitHub
}: {
  onMarkdown: () => void;
  onPdf: () => void;
  onGitHub: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onMarkdown}>
        <FileText className="size-4" />
        Export Markdown
      </Button>
      <Button variant="secondary" size="sm" onClick={onPdf}>
        <Download className="size-4" />
        Export PDF
      </Button>
      <Button variant="secondary" size="sm" onClick={onGitHub}>
        <Github className="size-4" />
        Send to GitHub
      </Button>
    </div>
  );
}
