import { useEffect, useState } from "react";
import AssignmentAdvisor from "./components/AssignmentAdvisor";
import CandidateTable from "./components/CandidateTable";
import ClarificationBridge from "./components/ClarificationBridge";
import MetricStrip from "./components/MetricStrip";
import StatePanel from "./components/StatePanel";
import SummaryCard from "./components/SummaryCard";
import Timeline from "./components/Timeline";
import {
  acceptRecommendation,
  createClarification,
  emitLocalRefresh,
  listenForRefresh,
  loadIssueWorkspace,
  publishSummaryComment,
  refreshAnalysis,
  resolveClarification,
  seedProfiles,
  startBackgroundCoordinator
} from "./lib/forge";

function SurfaceShell({ title, subtitle, children, busy }) {
  return (
    <main className="surface-shell">
      <header className="surface-header">
        <div>
          <p className="eyebrow">SpecBridge Copilot</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {busy ? <span className="surface-status">Updating...</span> : null}
      </header>
      {children}
    </main>
  );
}

function BackgroundSurface() {
  useEffect(() => {
    startBackgroundCoordinator();
  }, []);

  return (
    <main className="surface-shell background-shell">
      <section className="card">
        <p className="section-copy">SpecBridge background coordination is active for this issue view.</p>
      </section>
    </main>
  );
}

function PanelSurface({ workspace, busy, handlers }) {
  return (
    <SurfaceShell title={workspace.issue.summary || workspace.issue.issueKey} subtitle={`${workspace.issue.issueKey} - ${workspace.issue.status}`} busy={busy}>
      <MetricStrip intelligence={workspace.ticketIntelligence} thread={workspace.clarificationThread} />
      <div className="panel-grid">
        <AssignmentAdvisor workspace={workspace} onAssign={handlers.assign} onRefresh={handlers.refresh} onSeedProfiles={handlers.seed} busy={busy} />
        <SummaryCard workspace={workspace} onPublishSummary={handlers.publishSummary} busy={busy} />
      </div>
      <CandidateTable candidates={workspace.recommendation.topCandidates} clarifyFirst={workspace.recommendation.clarifyFirst} onAssign={handlers.assign} busy={busy} />
      <ClarificationBridge issue={workspace.issue} thread={workspace.clarificationThread} onCreate={handlers.createClarification} onResolve={handlers.resolveClarification} busy={busy} />
      <Timeline events={workspace.lifecycleEvents} />
    </SurfaceShell>
  );
}

function GlanceSurface({ workspace, busy, handlers }) {
  const topCandidate = workspace.recommendation.topCandidates[0];

  return (
    <SurfaceShell title="Compact signals" subtitle={`${workspace.issue.issueKey} snapshot`} busy={busy}>
      <MetricStrip intelligence={workspace.ticketIntelligence} thread={workspace.clarificationThread} />
      <div className="panel-grid">
        <AssignmentAdvisor workspace={workspace} onAssign={handlers.assign} onRefresh={handlers.refresh} onSeedProfiles={handlers.seed} busy={busy} />
        <SummaryCard workspace={workspace} onPublishSummary={handlers.publishSummary} busy={busy} />
      </div>
      {topCandidate ? (
        <section className="card">
          <p className="eyebrow">Recommended candidate</p>
          <h2>{topCandidate.displayName}</h2>
          <p className="section-copy">{workspace.ticketIntelligence.assignmentReason}</p>
        </section>
      ) : null}
    </SurfaceShell>
  );
}

function ActivitySurface({ workspace, busy, handlers }) {
  return (
    <SurfaceShell title="Issue activity" subtitle="Lifecycle events, summaries, and clarification milestones" busy={busy}>
      <SummaryCard workspace={workspace} onPublishSummary={handlers.publishSummary} busy={busy} />
      <Timeline events={workspace.lifecycleEvents} />
    </SurfaceShell>
  );
}

export default function App({ context }) {
  const moduleKey = context?.moduleKey || context?.extension?.moduleKey;
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(moduleKey !== "specbridge-issue-background");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (moduleKey === "specbridge-issue-background") {
      return undefined;
    }

    let active = true;

    async function load(initial = false) {
      if (initial) {
        setLoading(true);
      }

      try {
        const nextWorkspace = await loadIssueWorkspace();
        if (active) {
          setWorkspace(nextWorkspace);
          setError("");
        }
      } catch (nextError) {
        if (active) {
          setError(nextError.message || "Unable to load SpecBridge data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load(true);
    const stopListening = listenForRefresh(() => load(false));
    const intervalId = setInterval(() => load(false), 45000);

    return () => {
      active = false;
      clearInterval(intervalId);
      stopListening?.();
    };
  }, [moduleKey]);

  async function mutate(action) {
    setBusy(true);
    try {
      const result = await action();
      if (result?.issue) {
        setWorkspace(result);
      } else if (moduleKey !== "specbridge-issue-background") {
        setWorkspace(await loadIssueWorkspace());
      }
      await emitLocalRefresh({ source: "specbridge-ui" });
      setError("");
    } catch (nextError) {
      setError(nextError.message || "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (moduleKey === "specbridge-issue-background") {
    return <BackgroundSurface />;
  }

  if (loading) {
    return <StatePanel title="Loading SpecBridge" body="Pulling issue signals, team profiles, and clarification history." />;
  }

  if (error) {
    return <StatePanel title="SpecBridge hit an error" body={error} actionLabel="Try again" onAction={() => mutate(() => refreshAnalysis())} />;
  }

  if (!workspace) {
    return <StatePanel title="No issue data available" body="SpecBridge could not build a workspace for this issue." />;
  }

  const handlers = {
    refresh: () => mutate(() => refreshAnalysis()),
    seed: () => mutate(() => seedProfiles()),
    assign: (accountId) => mutate(() => acceptRecommendation(accountId)),
    createClarification: (payload) => mutate(() => createClarification(payload)),
    resolveClarification: (payload) => mutate(() => resolveClarification(payload)),
    publishSummary: () => mutate(() => publishSummaryComment())
  };

  if (moduleKey === "specbridge-issue-glance") {
    return <GlanceSurface workspace={workspace} busy={busy} handlers={handlers} />;
  }

  if (moduleKey === "specbridge-issue-activity") {
    return <ActivitySurface workspace={workspace} busy={busy} handlers={handlers} />;
  }

  return <PanelSurface workspace={workspace} busy={busy} handlers={handlers} />;
}
