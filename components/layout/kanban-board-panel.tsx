import { ShellPanel } from "@/components/ui/shell-panel";
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
  low: "bg-slate-100 text-slate-600",
  medium: "bg-accentSoft text-accent",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700"
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
            <div key={status} className="rounded-2xl border border-line bg-panelSoft p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  {statusLabels[status]}
                </h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
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
                        className={`w-full rounded-xl border bg-white p-4 text-left text-sm text-slate-600 shadow-panelSoft transition ${
                          selectedTicketId === ticket.id
                            ? "border-accent ring-2 ring-accent/10"
                            : "border-line hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-700">{ticket.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                              {ticket.code}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${priorityStyles[ticket.priority]}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="mt-3 leading-6 text-slate-500">{ticket.summary}</p>
                        {ticket.blockerReason ? (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            Blocked: {ticket.blockerReason}
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <span className="capitalize">{ticket.type}</span>
                          <span>{assignee?.name ?? "Unassigned"}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-white px-3 py-6 text-center text-sm text-slate-400">
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
