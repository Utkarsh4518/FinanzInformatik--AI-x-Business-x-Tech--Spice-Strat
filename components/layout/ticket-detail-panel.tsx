"use client";

import type {
  TeamMember,
  Ticket,
  TicketStatus,
  TicketUpdateInput
} from "@/lib/domain/models";

type TicketDetailPanelProps = {
  ticket: Ticket | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onUpdate: (ticketId: string, updates: TicketUpdateInput) => void;
};

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" }
];

export function TicketDetailPanel({
  ticket,
  teamMembers,
  onClose,
  onUpdate
}: TicketDetailPanelProps) {
  if (!ticket) {
    return (
      <div className="rounded-xl2 border border-line bg-panel p-5 shadow-panel">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ticket Detail
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Select a ticket from the board or table to inspect and edit its local state.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Ticket Detail
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{ticket.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            {ticket.code}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-line px-3 py-1 text-sm text-slate-500"
        >
          Close
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
        </div>

        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {ticket.businessSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Technical Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {ticket.technicalSummary}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Priority
            </div>
            <p className="mt-2 text-sm font-medium capitalize text-slate-700">
              {ticket.priority}
            </p>
          </div>

          <label className="rounded-2xl border border-line bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={ticket.status}
              onChange={(event) =>
                onUpdate(ticket.id, {
                  status: event.target.value as TicketStatus,
                  assigneeId: ticket.assigneeId,
                  blockerReason: ticket.blockerReason
                })
              }
              className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Assignee
          </span>
          <select
            value={ticket.assigneeId}
            onChange={(event) =>
              onUpdate(ticket.id, {
                status: ticket.status,
                assigneeId: event.target.value,
                blockerReason: ticket.blockerReason
              })
            }
            className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
          >
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blocker Reason
          </span>
          <textarea
            value={ticket.blockerReason}
            onChange={(event) =>
              onUpdate(ticket.id, {
                status: ticket.status,
                assigneeId: ticket.assigneeId,
                blockerReason: event.target.value
              })
            }
            rows={4}
            placeholder="No blocker currently recorded."
            className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-teal-400"
          />
        </label>
      </div>
    </div>
  );
}
