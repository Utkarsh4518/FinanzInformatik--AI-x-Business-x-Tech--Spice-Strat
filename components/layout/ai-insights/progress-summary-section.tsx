"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApiItemResponse,
  SummarizeProgressRequest,
  SummarizeProgressResponse
} from "@/lib/domain/api";
import type { AppRole, Project, TeamMember, Ticket, TicketComment } from "@/lib/domain/models";

type ProgressSummarySectionProps = {
  currentRole: AppRole;
  project: Project;
  tickets: Ticket[];
  teamMembers: TeamMember[];
  comments: TicketComment[];
};

function buildRequestSignature(
  project: Project,
  tickets: Ticket[],
  teamMembers: TeamMember[],
  comments: TicketComment[]
) {
  return JSON.stringify({
    projectId: project.id,
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      status: ticket.status,
      blockerReason: ticket.blockerReason,
      assigneeId: ticket.assigneeId
    })),
    teamMembers: teamMembers.map((member) => ({
      id: member.id,
      availabilityStatus: member.availabilityStatus,
      capacityPercent: member.capacityPercent
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      ticketId: comment.ticketId,
      message: comment.message
    }))
  });
}

export function ProgressSummarySection({
  currentRole,
  project,
  tickets,
  teamMembers,
  comments
}: ProgressSummarySectionProps) {
  const [summary, setSummary] = useState<SummarizeProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestSignature = useMemo(
    () => buildRequestSignature(project, tickets, teamMembers, comments),
    [comments, project, teamMembers, tickets]
  );

  const teamAvailabilityEffect = useMemo(() => {
    const unavailable = teamMembers.filter(
      (member) => member.availabilityStatus === "unavailable"
    ).length;
    const busy = teamMembers.filter((member) => member.availabilityStatus === "busy").length;

    if (unavailable > 0) {
      return `${unavailable} unavailable teammate${unavailable === 1 ? "" : "s"} and ${busy} busy teammate${busy === 1 ? "" : "s"} are affecting delivery capacity.`;
    }

    return `${busy} busy teammate${busy === 1 ? "" : "s"} currently require scope discipline, but no team members are marked unavailable.`;
  }, [teamMembers]);

  async function loadSummary() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/ai/summarize-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project,
          tickets,
          teamMembers,
          comments
        } satisfies SummarizeProgressRequest)
      });

      if (!response.ok) {
        throw new Error("Progress summary request failed.");
      }

      const payload =
        (await response.json()) as ApiItemResponse<SummarizeProgressResponse>;
      setSummary(payload.data);
    } catch (summaryError) {
      setError(
        summaryError instanceof Error
          ? summaryError.message
          : "Progress summary request failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, [requestSignature]);

  if (!summary && isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
            Progress Summary
          </div>
          <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs font-medium text-slate-600">
            Loading
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Generating the latest delivery summary from the current persisted project, ticket, team, and comment state.
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-700">
        <p>{error ?? "Progress summary is not available."}</p>
        <p className="mt-2 text-rose-600">
          Existing tickets and comments remain available while the summary is retried.
        </p>
        <button
          type="button"
          onClick={() => void loadSummary()}
          className="mt-3 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-panelSoft"
        >
          Retry Summary
        </button>
      </div>
    );
  }

  if (currentRole === "manager") {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Manager Progress Summary
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{summary.overallStatus}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs font-medium text-slate-600">
              {isLoading ? "Refreshing" : "Live"}
            </span>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-panelSoft p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Manager Readout
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {summary.managerFacingSummary}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{teamAvailabilityEffect}</p>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Blocked Items
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {summary.blockedItems.map((item) => (
                <li key={item} className="rounded-xl border border-rose-200 bg-rose-50/80 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Risks
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {summary.risks.map((item) => (
                <li key={item} className="rounded-xl border border-line bg-panelSoft p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next Steps
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {summary.nextSteps.map((item) => (
                <li key={item} className="rounded-xl border border-line bg-slate-50/90 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (currentRole === "analyst") {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Progress Summary
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs font-medium text-slate-600">
              {isLoading ? "Refreshing" : "Live"}
            </span>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {summary.businessFacingSummary}
        </p>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Open Concerns
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {[...summary.blockedItems, ...summary.risks].slice(0, 4).map((item) => (
              <li key={item} className="rounded-xl border border-line bg-panelSoft p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-5 shadow-panelSoft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Delivery Snapshot
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs font-medium text-slate-600">
            {isLoading ? "Refreshing" : "Live"}
          </span>
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{summary.overallStatus}</p>
      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            In Progress
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {summary.inProgressItems.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Next Steps
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {summary.nextSteps.slice(0, 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
