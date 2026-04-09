"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BellRing,
  BrainCircuit,
  ExternalLink,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

import {
  fetchJiraProjects,
  fetchSpecBridgeInbox,
  fetchSpecBridgeWorkspace,
  postSpecBridgeMessage,
} from "@/lib/api";
import type {
  JiraProject,
  SpecBridgeInboxItem,
  SpecBridgeQuestion,
  SpecBridgeWorkspace as SpecBridgeWorkspaceData,
} from "@/lib/types";

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function metricTone(score: number) {
  if (score >= 80) return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  if (score >= 65) return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  return "border-rose-400/20 bg-rose-500/10 text-rose-100";
}

function waitTone(side: "developer" | "requester" | "none") {
  if (side === "developer") return "Waiting on developer";
  if (side === "requester") return "Waiting on requester";
  return "Balanced";
}

function Timeline({ events }: { events: SpecBridgeWorkspaceData["lifecycleEvents"] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={`${event.eventType}-${event.timestamp}`} className="flex gap-4">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-fi-gradient" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold capitalize text-fi-text">
                {event.eventType.replace(/_/g, " ")}
              </p>
              <span className="text-[11px] uppercase tracking-[0.18em] text-fi-text/40">
                {formatDate(event.timestamp)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-fi-text/60">
              {event.aiInterpretation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpecBridgeWorkspace({ initialIssue = null }: { initialIssue?: string | null }) {

  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [projectKey, setProjectKey] = useState<string>("");
  const [inbox, setInbox] = useState<SpecBridgeInboxItem[]>([]);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(initialIssue);
  const [workspace, setWorkspace] = useState<SpecBridgeWorkspaceData | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftTarget, setDraftTarget] = useState<"developer" | "requester">("requester");
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function loadInbox(activeProject = projectKey) {
    setLoadingInbox(true);
    try {
      const nextInbox = await fetchSpecBridgeInbox(activeProject || undefined, undefined, 8);
      setInbox(nextInbox);
      setError(null);

      const nextSelected = selectedIssueKey ?? initialIssue ?? nextInbox[0]?.issueKey ?? null;
      if (nextSelected) {
        setSelectedIssueKey(nextSelected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Jira-backed SpecBridge inbox");
      setInbox([]);
    } finally {
      setLoadingInbox(false);
    }
  }

  async function loadWorkspace(issueKey: string) {
    setLoadingWorkspace(true);
    try {
      const next = await fetchSpecBridgeWorkspace(issueKey);
      setWorkspace(next);
      setError(null);
      window.history.replaceState({}, "", `/specbridge?issue=${issueKey}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load live Jira ticket intelligence");
      setWorkspace(null);
    } finally {
      setLoadingWorkspace(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchJiraProjects()
      .then((nextProjects) => {
        if (cancelled) return;
        setProjects(nextProjects);
        if (!projectKey && nextProjects[0]?.key) {
          setProjectKey(nextProjects[0].key);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectKey) return;
    void loadInbox(projectKey);
  }, [projectKey]);

  useEffect(() => {
    if (!selectedIssueKey) return;
    void loadWorkspace(selectedIssueKey);
  }, [selectedIssueKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (projectKey) {
        void loadInbox(projectKey);
      }
      if (selectedIssueKey) {
        void loadWorkspace(selectedIssueKey);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [projectKey, selectedIssueKey]);

  async function sendMessage(messageType: "question" | "note" | "resolution", question?: SpecBridgeQuestion) {
    const text = messageType === "resolution" ? resolutions[question?.id ?? ""]?.trim() : draftMessage.trim();
    if (!selectedIssueKey || !text) return;

    setSubmitting(true);
    try {
      const next = await postSpecBridgeMessage({
        issueKey: selectedIssueKey,
        text,
        directedTo:
          messageType === "resolution"
            ? question?.directedTo === "developer"
              ? "requester"
              : "developer"
            : draftTarget,
        messageType,
        questionId: question?.id,
      });
      setWorkspace(next);
      setDraftMessage("");
      if (question) {
        setResolutions((current) => ({ ...current, [question.id]: "" }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync the message back to Jira");
    } finally {
      setSubmitting(false);
    }
  }

  const metrics = useMemo(() => {
    if (!workspace) return [];

    return [
      {
        label: "Stability",
        value: `${workspace.ticketIntelligence.requirementStabilityScore}/100`,
        hint: "Live requirement stability from Jira fields and comments",
        tone: metricTone(workspace.ticketIntelligence.requirementStabilityScore),
      },
      {
        label: "Open Questions",
        value: String(workspace.ticketIntelligence.openQuestionsCount),
        hint: "Detected bridge questions still waiting on an answer",
        tone: "border-white/10 bg-white/[0.04] text-fi-text",
      },
      {
        label: "Ambiguity",
        value: String(workspace.ticketIntelligence.ambiguityCount),
        hint: "Vague or unstable wording found in the Jira ticket",
        tone: "border-white/10 bg-white/[0.04] text-fi-text",
      },
      {
        label: "Pending Side",
        value: waitTone(workspace.clarificationThread.pendingSide),
        hint: "Who needs to respond next in the live thread",
        tone: "border-white/10 bg-white/[0.04] text-fi-text",
      },
    ];
  }, [workspace]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-fi-text/65 hover:text-fi-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Bridge
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-fi-text md:text-5xl">
              SpecBridge Copilot
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-fi-text/60">
              Live Jira ticket intelligence in a separate tab. Jira remains the source of truth for ticket creation and assignment, while SpecBridge watches the issue, ranks live Jira assignees, and keeps the analyst-developer clarification thread in sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={projectKey}
              onChange={(event) => setProjectKey(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-fi-text outline-none"
            >
              {projects.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (projectKey) {
                  void loadInbox(projectKey);
                }
                if (selectedIssueKey) {
                  void loadWorkspace(selectedIssueKey);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-fi-text transition hover:bg-white/[0.1]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100/90">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,11,29,0.95),rgba(12,8,20,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-fi-text">
              <BellRing className="h-4 w-4 text-fi-magenta" />
              Jira Ticket Feed
            </div>
            <p className="mt-2 text-sm leading-6 text-fi-text/50">
              Auto-refreshing from Jira every 15 seconds so this tab follows tickets, comments, and assignment changes after they happen in Jira.
            </p>

            <div className="mt-5 space-y-3">
              {loadingInbox ? (
                <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-10 text-fi-text/55">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : null}

              {!loadingInbox && inbox.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-fi-text/60">
                  No Jira issues were returned for this project. Create or update a ticket in Jira and it will appear here on the next refresh.
                </div>
              ) : null}

              {inbox.map((item) => (
                <button
                  key={item.issueKey}
                  onClick={() => setSelectedIssueKey(item.issueKey)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedIssueKey === item.issueKey
                      ? "border-fi-magenta/50 bg-fi-magenta/10"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-fi-text/40">{item.issueKey}</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-fi-text">{item.summary}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${metricTone(item.stabilityScore)}`}>
                      {item.confidence}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-fi-text/50">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                      {item.status}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                      {item.openQuestionsCount} open
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                      {waitTone(item.pendingSide)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-fi-text/35">Updated {formatDate(item.updatedAt)}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(47,23,58,0.84),rgba(26,14,34,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-6">
            {loadingWorkspace && !workspace ? (
              <div className="flex min-h-[420px] items-center justify-center text-fi-text/60">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : null}

            {!loadingWorkspace && !workspace ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-fi-text/60">
                Pick a Jira issue from the left and SpecBridge will load the live ticket, real Jira users, candidate ranking, and the analyst-developer conversation.
              </div>
            ) : null}

            {workspace ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-fi-gradient px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        {workspace.issue.issueKey}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs ${metricTone(workspace.ticketIntelligence.requirementStabilityScore)}`}>
                        {workspace.ticketIntelligence.confidence} confidence
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-fi-text md:text-3xl">
                      {workspace.issue.summary}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-fi-text/60">
                      {workspace.ticketIntelligence.assignmentReason}
                    </p>
                  </div>

                  <a
                    href={workspace.issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-fi-text transition hover:bg-white/[0.1]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open In Jira
                  </a>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className={`rounded-2xl border px-4 py-4 ${metric.tone}`}>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-fi-text/45">{metric.label}</p>
                      <p className="mt-2 text-lg font-semibold">{metric.value}</p>
                      <p className="mt-1 text-xs text-fi-text/45">{metric.hint}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fi-text">
                      <BrainCircuit className="h-4 w-4 text-fi-magenta" />
                      Assignment Advisor
                    </div>

                    {workspace.recommendation.clarifyFirst ? (
                      <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm text-amber-100/85">
                        Clarification is recommended before assignment. SpecBridge will not suggest a final owner yet because the ticket is still unstable.
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <ShieldAlert className="h-4 w-4" />
                        Risks
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-amber-100/80">
                        {workspace.ticketIntelligence.assignmentRisks.length ? (
                          workspace.ticketIntelligence.assignmentRisks.map((risk) => (
                            <li key={risk}>{risk}</li>
                          ))
                        ) : (
                          <li>No active assignment blockers are flagged right now.</li>
                        )}
                      </ul>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-[11px] uppercase tracking-[0.18em] text-fi-text/40">
                          <tr>
                            <th className="pb-3 pr-4 font-medium">Candidate</th>
                            <th className="pb-3 pr-4 font-medium">Score</th>
                            <th className="pb-3 pr-4 font-medium">Why</th>
                            <th className="pb-3 font-medium">Jira Handoff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {workspace.recommendation.topCandidates.map((candidate) => (
                            <tr key={candidate.accountId}>
                              <td className="py-4 pr-4">
                                <p className="font-medium text-fi-text">{candidate.displayName}</p>
                                <p className="text-xs text-fi-text/40">{candidate.role}</p>
                              </td>
                              <td className="py-4 pr-4 text-fi-text">{candidate.totalScore}/100</td>
                              <td className="py-4 pr-4">
                                <div className="space-y-1 text-xs text-fi-text/50">
                                  {candidate.reasons.slice(0, 2).map((reason) => (
                                    <p key={reason}>{reason}</p>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4">
                                <a
                                  href={workspace.issue.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-medium text-fi-text transition hover:bg-white/[0.12]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Assign In Jira
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-fi-text">
                        <Sparkles className="h-4 w-4 text-fi-magenta" />
                        Latest AI Summary
                      </div>
                      <p className="mt-3 text-sm leading-7 text-fi-text/60">
                        {workspace.ticketIntelligence.lastAISummary}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fi-text">
                      <MessageSquareText className="h-4 w-4 text-fi-magenta" />
                      Analyst-Developer Bridge
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-fi-text/40">Requester</p>
                        <p className="mt-2 text-sm font-medium text-fi-text">
                          {workspace.issue.reporter?.displayName ?? "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-fi-text/40">Assignee</p>
                        <p className="mt-2 text-sm font-medium text-fi-text">
                          {workspace.issue.assignee?.displayName ?? "Unassigned in Jira"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-fi-text/60">
                      {workspace.clarificationThread.aiSummary}
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-3">
                          <select
                            value={draftTarget}
                            onChange={(event) => setDraftTarget(event.target.value as "developer" | "requester")}
                            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-fi-text outline-none"
                          >
                            <option value="requester">Send to requester</option>
                            <option value="developer">Send to developer</option>
                          </select>
                          <button
                            onClick={() => void sendMessage("question")}
                            disabled={submitting || !draftMessage.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-fi-gradient px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Ask Through Jira
                          </button>
                        </div>
                        <textarea
                          value={draftMessage}
                          onChange={(event) => setDraftMessage(event.target.value)}
                          placeholder="Write a clarification that will be posted back to the Jira issue thread..."
                          className="min-h-[104px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-fi-text placeholder:text-fi-text/35 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fi-text/40">
                        <UserRoundSearch className="h-3.5 w-3.5" />
                        Live conversation
                      </div>
                      <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                        {workspace.clarificationThread.messages.length ? (
                          workspace.clarificationThread.messages.map((message) => (
                            <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-fi-text">{message.authorDisplayName}</p>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-fi-text/45">
                                  {message.messageType}
                                </span>
                                <span className="text-xs text-fi-text/40">{formatDate(message.createdAt)}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-fi-text/65">{message.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm leading-7 text-fi-text/55">
                            No bridge conversation has been detected yet. Ask the first clarification and it will be stored on the Jira issue.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fi-text/40">
                          <MessageSquareText className="h-3.5 w-3.5" />
                          Open questions
                        </div>
                        {workspace.clarificationThread.openQuestions.length ? (
                          workspace.clarificationThread.openQuestions.map((question) => (
                            <div key={question.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <p className="text-sm font-medium text-fi-text">{question.text}</p>
                              <p className="mt-2 text-xs text-fi-text/40">
                                {question.askedByDisplayName} - {formatDate(question.askedAt)}
                              </p>
                              <textarea
                                value={resolutions[question.id] ?? ""}
                                onChange={(event) =>
                                  setResolutions((current) => ({
                                    ...current,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                placeholder="Reply and resolve this through Jira..."
                                className="mt-4 min-h-[96px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-fi-text placeholder:text-fi-text/35 outline-none"
                              />
                              <button
                                onClick={() => void sendMessage("resolution", question)}
                                disabled={submitting || !(resolutions[question.id] ?? "").trim()}
                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-medium text-fi-text transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Resolve In Jira
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4 text-sm text-emerald-100/85">
                            No unanswered clarification items are open right now.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fi-text/40">
                          <Sparkles className="h-3.5 w-3.5" />
                          Resolved and accepted
                        </div>
                        {workspace.clarificationThread.resolvedQuestions.length ? (
                          workspace.clarificationThread.resolvedQuestions.map((question) => (
                            <div key={question.id} className="rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-4">
                              <p className="text-sm font-medium text-fi-text">{question.text}</p>
                              <p className="mt-3 text-sm leading-7 text-fi-text/60">{question.resolution}</p>
                              <p className="mt-2 text-xs text-fi-text/40">
                                Resolved {question.resolvedAt ? formatDate(question.resolvedAt) : "recently"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-fi-text/55">
                            Resolved clarifications will appear here and feed the acceptance criteria suggestions.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 xl:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fi-text">
                      <Activity className="h-4 w-4 text-fi-magenta" />
                      Ticket Watcher Timeline
                    </div>
                    <div className="mt-5">
                      <Timeline events={workspace.lifecycleEvents} />
                    </div>
                  </section>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
