import { ShellPanel } from "@/components/ui/shell-panel";
import type { JiraSyncRunDetail } from "@/lib/domain/api";
import type { JiraSyncRun, TeamMember, Ticket } from "@/lib/domain/models";

type JiraSyncOverviewPanelProps = {
  syncRuns: JiraSyncRun[];
  latestSyncRunDetail: JiraSyncRunDetail | null;
  importedTickets: Ticket[];
  teamMembers: TeamMember[];
  onSelectTicket: (ticketId: string) => void;
  onImportJira: () => Promise<void>;
  isImportingJira: boolean;
  jiraImportMessage: string | null;
  jiraImportError: string | null;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not finished";
  }

  return new Date(value).toLocaleString();
}

export function JiraSyncOverviewPanel({
  syncRuns,
  latestSyncRunDetail,
  importedTickets,
  teamMembers,
  onSelectTicket,
  onImportJira,
  isImportingJira,
  jiraImportMessage,
  jiraImportError
}: JiraSyncOverviewPanelProps) {
  const latestRun = syncRuns[0] ?? null;
  const memberById = new Map(teamMembers.map((member) => [member.id, member.name]));

  return (
    <ShellPanel
      title="Jira Sync"
      description="Visibility into the latest Jira import execution and the Jira-backed tickets now available in BridgeFlow."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              Jira Import Control
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pull Jira issues into the persisted BridgeFlow ticket store and capture a visible sync record for the demo.
            </p>
            {jiraImportMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{jiraImportMessage}</p>
            ) : null}
            {jiraImportError ? (
              <p className="mt-3 text-sm text-rose-700">
                {jiraImportError} Existing local and imported tickets remain available.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void onImportJira()}
            disabled={isImportingJira}
            className="rounded-xl border border-line bg-panelSoft px-4 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:text-slate-400 hover:bg-white"
          >
            {isImportingJira ? "Syncing..." : "Sync Jira Issues"}
          </button>
        </div>

        {latestRun ? (
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-line bg-panelSoft p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Latest Sync Summary
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Project key: {latestRun.projectKey ?? "Not specified"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    latestRun.status === "completed"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : latestRun.status === "failed"
                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                        : "border border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {latestRun.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Fetched</div>
                  <div className="mt-2 text-xl font-semibold text-slate-800">
                    {latestRun.fetchedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Imported</div>
                  <div className="mt-2 text-xl font-semibold text-slate-800">
                    {latestRun.importedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Updated</div>
                  <div className="mt-2 text-xl font-semibold text-slate-800">
                    {latestRun.updatedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Skipped</div>
                  <div className="mt-2 text-xl font-semibold text-slate-800">
                    {latestRun.skippedCount}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p>Started: {formatTimestamp(latestRun.startedAt)}</p>
                <p>Finished: {formatTimestamp(latestRun.finishedAt)}</p>
                {latestRun.errorMessage ? (
                  <p className="text-rose-700">{latestRun.errorMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Latest Sync Items
              </div>
              <div className="mt-4 space-y-3">
                {latestSyncRunDetail?.items.length ? (
                  latestSyncRunDetail.items.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-line bg-panelSoft p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.externalKey}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            item.actionTaken === "imported"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : item.actionTaken === "updated"
                                ? "border border-blue-200 bg-blue-50 text-blue-700"
                                : "border border-line bg-white text-slate-500"
                          }`}
                        >
                          {item.actionTaken}
                        </span>
                      </div>
                      {item.message ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-panelSoft p-4 text-sm text-slate-500">
                    No per-item Jira sync detail is available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-panelSoft p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              No Sync Recorded Yet
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Click <span className="font-medium text-slate-700">Import / Sync Jira</span> above to pull Jira issues into BridgeFlow. Each run creates a sync record shown here with per-ticket action detail.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-panelSoft">
          <div className="grid grid-cols-[0.85fr_1.8fr_0.95fr_0.95fr_1fr_0.9fr_1.1fr] bg-[#f1f3f6] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>Jira Key</span>
            <span>Ticket Title</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span>Source</span>
            <span>Last Synced</span>
          </div>
          {importedTickets.length ? (
            importedTickets.slice(0, 12).map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelectTicket(ticket.id)}
                className="grid w-full grid-cols-[0.85fr_1.8fr_0.95fr_0.95fr_1fr_0.9fr_1.1fr] border-t border-line px-5 py-4 text-left text-sm text-slate-600 transition hover:bg-panelSoft/60"
              >
                <span className="font-semibold text-slate-800">
                  {ticket.externalKey ?? ticket.code}
                </span>
                <span className="pr-3">{ticket.title}</span>
                <span className="capitalize">{ticket.status.replaceAll("_", " ")}</span>
                <span className="capitalize">{ticket.priority}</span>
                <span>{memberById.get(ticket.assigneeId) ?? "Unassigned"}</span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    ticket.sourceType === "jira"
                      ? "border border-accent/15 bg-accentSoft text-accent"
                      : "border border-line bg-panelSoft text-slate-500"
                  }`}
                >
                  {ticket.sourceType === "jira" ? "Jira" : "BridgeFlow"}
                </span>
                <span>{formatTimestamp(ticket.lastSyncedAt)}</span>
              </button>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No Jira-backed tickets are available yet.
            </div>
          )}
        </div>
      </div>
    </ShellPanel>
  );
}
