"use client";

import { useMemo, useState } from "react";

import type { CreateHandoverRequest } from "@/lib/domain/api";
import { ShellPanel } from "@/components/ui/shell-panel";
import type {
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket
} from "@/lib/domain/models";

type AIInsightsPanelProps = {
  project: Project;
  handovers: Handover[];
  repoFileSummaries: RepoFileSummary[];
  teamMembers: TeamMember[];
  tickets: Ticket[];
  onCreateHandover: (input: CreateHandoverRequest) => Promise<void>;
};

export function AIInsightsPanel({
  project,
  handovers,
  repoFileSummaries,
  teamMembers,
  tickets,
  onCreateHandover
}: AIInsightsPanelProps) {
  const [unavailableMemberId, setUnavailableMemberId] = useState(
    teamMembers.find((member) => member.availabilityStatus === "unavailable")?.id ??
      teamMembers[0]?.id ??
      ""
  );
  const [fallbackOwnerId, setFallbackOwnerId] = useState(teamMembers[0]?.id ?? "");
  const [summary, setSummary] = useState(
    "Save a fresh handover snapshot for the current blocked and open work."
  );

  const latestHandover = handovers[0] ?? null;
  const unavailableMember = teamMembers.find(
    (member) => member.id === latestHandover?.unavailableMemberId
  );
  const fallbackOwner = teamMembers.find(
    (member) => member.id === latestHandover?.fallbackOwnerId
  );
  const handoverTickets = tickets.filter((ticket) =>
    latestHandover?.openTicketIds.includes(ticket.id)
  );

  const insightBlocks = [
    {
      label: "Business Summary",
      text: project.businessSummary
    },
    {
      label: "Technical Translation",
      text: project.technicalSummary
    },
    {
      label: "Manager Summary",
      text: project.managerSummary
    }
  ];

  const currentBlockers = useMemo(
    () => tickets.map((ticket) => ticket.blockerReason).filter(Boolean),
    [tickets]
  );
  const currentOpenTicketIds = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "done").map((ticket) => ticket.id),
    [tickets]
  );

  async function handleSaveHandover() {
    await onCreateHandover({
      projectId: project.id,
      unavailableMemberId,
      fallbackOwnerId,
      summary,
      openTicketIds: currentOpenTicketIds,
      blockers: currentBlockers
    });

    setSummary("Saved another handover snapshot for the current delivery state.");
  }

  return (
    <ShellPanel
      title="AI Insights"
      description="Space for summaries, translations, and handover support."
    >
      <div className="space-y-3">
        {insightBlocks.map((block) => (
          <div
            key={block.label}
            className="rounded-2xl border border-line bg-slate-50 p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              {block.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{block.text}</p>
          </div>
        ))}

        {latestHandover ? (
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Handover Status
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {handovers.length} records
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{latestHandover.summary}</p>
            <div className="mt-3 text-sm text-slate-500">
              <p>Unavailable teammate: {unavailableMember?.name ?? "Unknown"}</p>
              <p>Fallback owner: {fallbackOwner?.name ?? "Unknown"}</p>
            </div>
            <div className="mt-3 space-y-2">
              {handoverTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-line bg-slate-50 p-3">
                  <p className="font-medium text-slate-700">{ticket.code}</p>
                  <p className="mt-1 text-sm text-slate-500">{ticket.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Save Handover
          </div>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Unavailable Teammate
              </span>
              <select
                value={unavailableMemberId}
                onChange={(event) => setUnavailableMemberId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Fallback Owner
              </span>
              <select
                value={fallbackOwnerId}
                onChange={(event) => setFallbackOwnerId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Summary
              </span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-teal-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleSaveHandover()}
              className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white"
            >
              Save Handover Record
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Repo Impact Snapshot
          </div>
          <div className="mt-3 space-y-2">
            {repoFileSummaries.map((file) => (
              <div key={file.id} className="rounded-xl border border-line bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">{file.path}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {file.area}
                </p>
                <p className="mt-2 text-sm text-slate-500">{file.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
