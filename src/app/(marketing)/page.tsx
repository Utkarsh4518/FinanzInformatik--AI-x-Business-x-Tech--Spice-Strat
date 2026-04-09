"use client";

import Link from "next/link";
import { ArrowRight, BookCheck, FolderGit2, GitPullRequestArrow, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { useWorkspaceStore } from "@/lib/state/workspace-store";

const quickActions = [
  {
    title: "Start from requirement",
    description: "Turn a natural-language feature request into a shared spec and clarification set.",
    href: "/workspace",
    icon: BookCheck
  },
  {
    title: "Import GitHub repo",
    description: "Index a codebase, surface relevant files, and explain implementation areas.",
    href: "/codebase",
    icon: FolderGit2
  },
  {
    title: "Paste PR diff",
    description: "Translate technical code changes into business-ready language.",
    href: "/pr-summary",
    icon: GitPullRequestArrow
  },
  {
    title: "Load demo scenario",
    description: "Open the full loan-term scenario with seeded data and activity history.",
    href: "/demo",
    icon: PlayCircle
  }
];

export default function DashboardPage() {
  const analysis = useWorkspaceStore((state) => state.analysis);
  const alignment = useWorkspaceStore((state) => state.alignment);
  const activity = useWorkspaceStore((state) => state.activity);
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);

  return (
    <AppShell title="Dashboard">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-6 px-6 py-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                AI Collaboration Cockpit
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-text">
                  Bridge business intent and technical execution with live evidence, not guesswork.
                </h1>
                <p className="max-w-2xl text-base text-text-muted">
                  SpecBridge helps business analysts, developers, and reviewers align on features, explore repositories, explain pull requests, and flag missing behavior before release.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/workspace">
                    Start New Requirement
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/codebase">Connect Repository</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/demo">Open Demo</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-bank border border-border bg-muted-surface p-5">
              <p className="section-title">How it works</p>
              <div className="mt-4 grid gap-3">
                {["Requirement", "Shared Spec", "Technical Tasks", "Code Review Summary", "Alignment Report"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 shadow-card">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Ambiguities Found" value={analysis?.ambiguities.length ?? 0} hint="Items needing product clarification." status="warning" />
          <StatCard label="Requirements Covered" value={`${alignment?.coverageScore ?? 0}%`} hint="Current implementation coverage score." status="success" />
          <StatCard label="Open Questions" value={analysis?.ambiguities.filter((item) => item.status === "open").length ?? 0} hint="Still unresolved before approval." status="warning" />
          <StatCard label="Risk Alerts" value={alignment?.businessRisks.length ?? 0} hint="Business or UX concerns detected." status="danger" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <div>
                <p className="section-title">Quick Actions</p>
                <h2 className="mt-2 text-xl font-semibold text-text">Launch the next workflow immediately</h2>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="focus-ring rounded-bank border border-border bg-muted-surface p-5 transition-transform hover:-translate-y-0.5 hover:shadow-card"
                >
                  <action.icon className="mb-4 size-8 text-primary" />
                  <h3 className="text-lg font-semibold text-text">{action.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{action.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="section-title">Recent Workspace</p>
                <h2 className="mt-2 text-xl font-semibold text-text">{workspace.title}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-muted-surface p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Current requirement</p>
                <p className="mt-2 text-sm text-text">{workspace.requirementText}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Last actions</p>
                <div className="mt-3 space-y-3">
                  {activity.slice(0, 3).map((event) => (
                    <div key={event.id} className="text-sm text-text">
                      {event.message}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
