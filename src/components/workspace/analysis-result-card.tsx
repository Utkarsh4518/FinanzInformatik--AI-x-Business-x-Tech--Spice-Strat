"use client";

import { useState } from "react";
import { ChevronDown, Copy, Pin, RefreshCcw, SendHorizontal } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useUIStore } from "@/lib/state/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AnalysisResultCard({
  title,
  content,
  onRegenerate
}: {
  title: string;
  content: string[];
  onRegenerate?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pushToast = useUIStore((state) => state.pushToast);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title">Analysis Output</p>
            <h3 className="mt-2 text-lg font-semibold text-text">{title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await copyToClipboard(content.join("\n"));
                pushToast({ title: `${title} copied`, variant: "success" });
              }}
            >
              <Copy className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((value) => !value)}>
              <ChevronDown className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => pushToast({ title: `${title} pinned`, description: "Pinned to the review flow." })}>
              <Pin className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <RefreshCcw className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => pushToast({ title: `${title} sent`, description: "The card was sent to the developer view." })}>
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-3">
          {content.map((item) => (
            <div key={item} className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
              {item}
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
