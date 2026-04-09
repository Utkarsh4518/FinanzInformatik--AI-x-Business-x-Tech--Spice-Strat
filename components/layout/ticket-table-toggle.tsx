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
      description="Secondary view placeholder for teams that prefer a compact list."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Board Active
          </button>
          <button
            type="button"
            className="rounded-full border border-line bg-white px-3 py-2 text-sm text-slate-600"
          >
            Table Synced
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[0.8fr_1.8fr_1.1fr_0.8fr_0.9fr] bg-slate-100/90 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Ticket</span>
            <span>Summary</span>
            <span>Owner</span>
            <span>Priority</span>
            <span>Status</span>
          </div>
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket.id)}
              className={`grid w-full grid-cols-[0.8fr_1.8fr_1.1fr_0.8fr_0.9fr] border-t px-4 py-3 text-left text-sm text-slate-600 transition ${
                selectedTicketId === ticket.id
                  ? "border-slate-300 bg-slate-50"
                  : "border-line bg-white hover:bg-slate-50"
              }`}
            >
              <span className="font-medium text-slate-700">{ticket.code}</span>
              <span>{ticket.title}</span>
              <span>{memberById.get(ticket.assigneeId)?.name ?? "Unassigned"}</span>
              <span className="capitalize">{ticket.priority}</span>
              <span>{statusLabels[ticket.status]}</span>
            </button>
          ))}
        </div>
      </div>
    </ShellPanel>
  );
}
