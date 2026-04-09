import { ShellPanel } from "@/components/ui/shell-panel";
import { TicketSourceBadge } from "@/components/ui/ticket-source-badge";
import type { TeamMember, Ticket, TicketStatus } from "@/lib/domain/models";

type KanbanBoardPanelProps = {
  tickets: Ticket[];
  teamMembers: TeamMember[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
};

const statusOrder: TicketStatus[] = ["backlog", "in_progress", "review", "done"];

const statusLabels: Record<TicketStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};

const priorityStyles: Record<Ticket["priority"], string> = {
  low: "border border-line bg-white text-slate-600",
  medium: "border border-accent/10 bg-accentSoft text-accent",
  high: "border border-amber-200 bg-amber-50 text-amber-700",
  critical: "border border-rose-200 bg-rose-50 text-rose-700"
};

export function KanbanBoardPanel({
  tickets,
  teamMembers,
  selectedTicketId,
  onSelectTicket
}: KanbanBoardPanelProps) {
  const memberById = new Map(teamMembers.map((member) => [member.id, member]));

  return (
    <ShellPanel
      title="Kanban Board"
      description="Primary delivery view for generated work items and current status."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {statusOrder.map((status) => {
          const columnTickets = tickets.filter((ticket) => ticket.status === status);

          return (
            <div
              key={status}
              className="rounded-2xl border border-line bg-panelSoft/90 p-3.5 shadow-panelSoft"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {statusLabels[status]}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {status === "backlog"
                      ? "Planned work"
                      : status === "in_progress"
                        ? "Active delivery"
                        : status === "review"
                          ? "Validation and sign-off"
                          : "Completed items"}
                  </p>
                </div>
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  {columnTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTickets.length ? (
                  columnTickets.map((ticket) => {
                    const assignee = memberById.get(ticket.assigneeId);

                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => onSelectTicket(ticket.id)}
                        className={`w-full rounded-2xl border bg-white p-4 text-left text-sm text-slate-600 shadow-panelSoft transition ${
                          selectedTicketId === ticket.id
                            ? "border-accent bg-accentSoft/55 ring-1 ring-accent/10"
                            : "border-line hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium leading-6 text-ink">
                              {ticket.title}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full border border-line bg-panelSoft px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {ticket.code}
                              </span>
                              <TicketSourceBadge ticket={ticket} />
                              <span className="rounded-full border border-line bg-panelSoft px-2 py-1 text-[11px] font-medium capitalize text-slate-500">
                                {ticket.type}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${priorityStyles[ticket.priority]}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-3 leading-6 text-slate-600">
                          {ticket.summary}
                        </p>

                        {ticket.blockerReason ? (
                          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                            Blocked: {ticket.blockerReason}
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] uppercase tracking-wide text-slate-400">Owner</span>
                            <span className="text-xs font-medium text-slate-600">
                              {assignee?.name ?? "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] uppercase tracking-wide text-slate-400">Source</span>
                            <span className="text-xs font-medium text-slate-600">
                              {ticket.sourceType === "jira"
                                ? ticket.externalKey ?? "Jira"
                                : "BridgeFlow"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-line bg-white px-3 py-8 text-center text-sm leading-6 text-slate-400">
                    No tickets in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ShellPanel>
  );
}
