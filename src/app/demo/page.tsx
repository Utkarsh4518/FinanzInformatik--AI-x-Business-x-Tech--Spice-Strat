"use client";

import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DemoLoader } from "@/components/demo/demo-loader";
import { useWorkspaceStore } from "@/lib/state/workspace-store";

export default function DemoPage() {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const spec = useWorkspaceStore((state) => state.spec);
  const alignment = useWorkspaceStore((state) => state.alignment);

  return (
    <AppShell title="Demo Mode">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Demo Mode" }]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DemoLoader />
        <Card>
          <CardHeader>
            <div>
              <p className="section-title">Loaded Scenario</p>
              <h2 className="mt-2 text-xl font-semibold text-text">{workspace.title}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted-surface p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Requirement</p>
              <p className="mt-2 text-sm text-text">{workspace.requirementText}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Shared spec</p>
              <p className="mt-2 text-sm text-text">{spec?.featureName}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Alignment score</p>
              <p className="mt-2 text-sm text-text">{alignment?.coverageScore}% coverage</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
