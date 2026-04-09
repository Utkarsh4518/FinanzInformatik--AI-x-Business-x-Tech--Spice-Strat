import { ShellPanel } from "@/components/ui/shell-panel";
import type { TeamMember, Ticket, TicketStatus } from "@/lib/domain/models";

type TicketTableToggleProps = {
  tickets: Ticket[];
  teamMembers: TeamMember[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
};

const statusLabels: Record<TicketStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};

const priorityStyles: Record<Ticket["priority"], string> = {
  low: "border border-line bg-panelSoft text-slate-600",
  medium: "border border-accent/10 bg-accentSoft text-accent",
  high: "border border-amber-200 bg-amber-50 text-amber-700",
  critical: "border border-rose-200 bg-rose-50 text-rose-700"
};

export function TicketTableToggle({
  tickets,
  teamMembers,
  selectedTicketId,
  onSelectTicket
}: TicketTableToggleProps) {
  const memberById = new Map(teamMembers.map((member) => [member.id, member]));

  return (
    <ShellPanel
      title="Ticket Table View"
      description="Compact review view for the same tickets shown on the board."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600">
            Synced with kanban board
          </span>
          <span className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600">
            Click a row to open detail
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-panelSoft">
          <div className="grid grid-cols-[0.85fr_1.9fr_1.05fr_0.95fr_1fr] bg-panelSoft px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Ticket</span>
            <span>Summary</span>
            <span>Owner</span>
            <span>Priority</span>
            <span>Status</span>
          </div>
          {tickets.length ? (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelectTicket(ticket.id)}
                className={`grid w-full grid-cols-[0.85fr_1.9fr_1.05fr_0.95fr_1fr] border-t px-5 py-4 text-left text-sm text-slate-600 transition ${
                  selectedTicketId === ticket.id
                    ? "border-accent/20 bg-accentSoft/55"
                    : "border-line bg-white hover:bg-panelSoft/70"
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-800">{ticket.code}</span>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {ticket.type}
                  </p>
                </div>
                <div className="pr-4">
                  <span className="font-medium text-slate-700">{ticket.title}</span>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                    {ticket.summary}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    {memberById.get(ticket.assigneeId)?.name ?? "Unassigned"}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityStyles[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <span className="inline-flex rounded-full border border-line bg-panelSoft px-2.5 py-1 text-xs font-medium text-slate-600">
                    {statusLabels[ticket.status]}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="bg-white px-4 py-8 text-center text-sm text-slate-500">
              No tickets are available yet. Run the intake organizer or reset the demo scenario.
            </div>
          )}
        </div>
      </div>
    </ShellPanel>
  );
}
