"use client";

import { useMemo, useState } from "react";

import { TranslateTab } from "@/components/layout/ai-insights/translate-tab";
import { ShellPanel } from "@/components/ui/shell-panel";
import type {
  CreateHandoverRequest,
  OrganizeProjectResponse
} from "@/lib/domain/api";
import type {
  AppRole,
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket
} from "@/lib/domain/models";

type AIInsightsPanelProps = {
  currentRole: AppRole;
  project: Project;
  handovers: Handover[];
  repoFileSummaries: RepoFileSummary[];
  teamMembers: TeamMember[];
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  managerRawInput: string;
  organizeResult: OrganizeProjectResponse | null;
  onCreateHandover: (input: CreateHandoverRequest) => Promise<void>;
};

type InsightsTab = "insights" | "translate";

const roleLabels: Record<AppRole, string> = {
  manager: "Manager",
  analyst: "Analyst",
  developer: "Developer"
};

export function AIInsightsPanel({
  currentRole,
  project,
  handovers,
  repoFileSummaries,
  teamMembers,
  tickets,
  selectedTicket,
  managerRawInput,
  organizeResult,
  onCreateHandover
}: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<InsightsTab>("insights");
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
  const teamAvailabilitySummary = {
    available: teamMembers.filter((member) => member.availabilityStatus === "available")
      .length,
    busy: teamMembers.filter((member) => member.availabilityStatus === "busy").length,
    unavailable: teamMembers.filter(
      (member) => member.availabilityStatus === "unavailable"
    ).length
  };
  const progressSummary = {
    done: tickets.filter((ticket) => ticket.status === "done").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    blocked: tickets.filter((ticket) => ticket.blockerReason.trim()).length
  };

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

  const roleSpecificContent =
    currentRole === "manager" ? (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Executive Snapshot
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {organizeResult?.projectSummary ?? project.managerSummary}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-slate-50/90 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Done</div>
              <div className="mt-2 text-xl font-semibold text-slate-800">
                {progressSummary.done}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-slate-50/90 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                In Progress
              </div>
              <div className="mt-2 text-xl font-semibold text-slate-800">
                {progressSummary.inProgress}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-rose-50/80 p-3">
              <div className="text-xs uppercase tracking-wide text-rose-400">Blocked</div>
              <div className="mt-2 text-xl font-semibold text-rose-700">
                {progressSummary.blocked}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Risks And Blockers
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(organizeResult?.risks ?? currentBlockers).slice(0, 4).map((item) => (
              <li
                key={item}
                className="rounded-xl border border-rose-200 bg-rose-50/80 p-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Team Availability
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-slate-50/90 p-3 text-sm text-slate-600">
              Available
              <div className="mt-2 text-lg font-semibold text-slate-800">
                {teamAvailabilitySummary.available}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-amber-50/80 p-3 text-sm text-amber-700">
              Busy
              <div className="mt-2 text-lg font-semibold">{teamAvailabilitySummary.busy}</div>
            </div>
            <div className="rounded-xl border border-line bg-rose-50/80 p-3 text-sm text-rose-700">
              Unavailable
              <div className="mt-2 text-lg font-semibold">
                {teamAvailabilitySummary.unavailable}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : currentRole === "analyst" ? (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Summary
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedTicket?.businessSummary ?? project.businessSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Clarified Scope
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(organizeResult?.clarifiedScope ?? [project.businessSummary]).map((item) => (
              <li key={item} className="rounded-xl border border-line bg-slate-50/90 p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Open Questions
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(organizeResult?.openQuestions ?? ["Clarify remaining business assumptions."]).map(
              (item) => (
                <li key={item} className="rounded-xl border border-line bg-slate-50/90 p-3">
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Technical Summary
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedTicket?.technicalSummary ?? project.technicalSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Dependency Focus
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(selectedTicket?.dependencies.length
              ? selectedTicket.dependencies
              : ["No explicit dependencies recorded."]).map((item) => (
              <li key={item} className="rounded-xl border border-line bg-slate-50/90 p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blocker Detail
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedTicket?.blockerReason || "No blocker currently recorded."}
          </p>
        </div>
      </div>
    );

  return (
    <ShellPanel
      title={`AI Insights · ${roleLabels[currentRole]} View`}
      description="The same project data, reordered and emphasized for the selected role."
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-slate-50/90 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "insights"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("translate")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "translate"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Translate
          </button>
        </div>

        {activeTab === "translate" ? (
          <TranslateTab
            managerRawInput={managerRawInput}
            selectedTicket={selectedTicket}
          />
        ) : (
          <div className="space-y-4">
            {roleSpecificContent}

            {latestHandover && currentRole === "manager" ? (
              <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Handover Status
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {handovers.length} records
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {latestHandover.summary}
                </p>
                <div className="mt-4 text-sm text-slate-500">
                  <p>Unavailable teammate: {unavailableMember?.name ?? "Unknown"}</p>
                  <p>Fallback owner: {fallbackOwner?.name ?? "Unknown"}</p>
                </div>
                <div className="mt-4 space-y-2">
                  {handoverTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-line bg-slate-50/90 p-3"
                    >
                      <p className="font-medium text-slate-700">{ticket.code}</p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {currentRole === "manager" ? (
              <div className="rounded-2xl border border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Save Handover
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Unavailable Teammate
                    </span>
                    <select
                      value={unavailableMemberId}
                      onChange={(event) => setUnavailableMemberId(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
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
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
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
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleSaveHandover()}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Save Handover Record
                  </button>
                </div>
              </div>
            ) : null}

            {currentRole === "developer" ? (
              <div className="rounded-2xl border border-dashed border-line bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Repo Impact Snapshot
                </div>
                <div className="mt-4 space-y-2">
                  {repoFileSummaries.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-xl border border-line bg-slate-50/90 p-3"
                    >
                      <p className="text-sm font-medium text-slate-700">{file.path}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {file.area}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{file.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </ShellPanel>
  );
}
