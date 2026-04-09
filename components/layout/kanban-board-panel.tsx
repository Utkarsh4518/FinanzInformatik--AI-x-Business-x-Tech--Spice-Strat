import { ShellPanel } from "@/components/ui/shell-panel";
import type { TeamMember, Ticket, TicketStatus } from "@/lib/domain/models";

type KanbanBoardPanelProps = {
  tickets: Ticket[];
  teamMembers: TeamMember[];
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
  medium: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700"
};

export function KanbanBoardPanel({
  tickets,
  teamMembers
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
            className="rounded-2xl border border-line bg-slate-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{statusLabels[status]}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                {columnTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTickets.map((ticket) => {
                const assignee = memberById.get(ticket.assigneeId);

                return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-line bg-white p-3 text-sm text-slate-600 shadow-sm"
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
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize">{ticket.type}</span>
                    <span>{assignee?.name ?? "Unassigned"}</span>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </ShellPanel>
  );
}
