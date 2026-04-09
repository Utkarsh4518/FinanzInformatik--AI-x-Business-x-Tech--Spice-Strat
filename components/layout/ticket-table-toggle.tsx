import { ShellPanel } from "@/components/ui/shell-panel";

const sampleRows = [
  ["BF-101", "Scope loan calculator extension", "In Progress"],
  ["BF-102", "Translate requirements", "Backlog"],
  ["BF-103", "Prepare manager summary", "Review"]
];

export function TicketTableToggle() {
  return (
    <ShellPanel
      title="Ticket Table View"
      description="Secondary view placeholder for teams that prefer a compact list."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-ink px-3 py-2 text-sm font-medium text-white"
          >
            Board Active
          </button>
          <button
            type="button"
            className="rounded-full border border-line bg-white px-3 py-2 text-sm text-slate-600"
          >
            Table Placeholder
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[0.9fr_2fr_1fr] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Ticket</span>
            <span>Summary</span>
            <span>Status</span>
          </div>
          {sampleRows.map(([ticket, summary, status]) => (
            <div
              key={ticket}
              className="grid grid-cols-[0.9fr_2fr_1fr] border-t border-line bg-white px-4 py-3 text-sm text-slate-600"
            >
              <span className="font-medium text-slate-700">{ticket}</span>
              <span>{summary}</span>
              <span>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </ShellPanel>
  );
}
