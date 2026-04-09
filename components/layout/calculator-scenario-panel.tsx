import { ShellPanel } from "@/components/ui/shell-panel";
import type { Project, Ticket } from "@/lib/domain/models";

type CalculatorScenarioPanelProps = {
  project: Project;
  tickets: Ticket[];
};

export function CalculatorScenarioPanel({
  project,
  tickets
}: CalculatorScenarioPanelProps) {
  const relatedTickets = tickets
    .filter(
      (ticket) =>
        ticket.title.toLowerCase().includes("loan") ||
        ticket.description.toLowerCase().includes("loan") ||
        ticket.businessSummary.toLowerCase().includes("calculator")
    )
    .slice(0, 5);

  return (
    <ShellPanel
      title="Calculator Scenario"
      description="Static demo framing for the loan calculator extension and why BridgeFlow matters."
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-panelSoft p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              Current Context
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {project.businessSummary}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              New Feature
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              The hackathon scenario extends the loan calculator so users can derive
              loan term from payment-driven inputs, not just view existing payment
              outputs. That means business rules, wording, validation, UI states,
              and ownership all have to stay aligned.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              Why Collaboration Matters
            </div>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>Managers need scope, risk, and progress explained without technical overload.</li>
              <li>Analysts need business rules clarified across multilingual and ambiguous notes.</li>
              <li>Developers need technical framing, likely file impact, and clean handovers when ownership shifts.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
            Related Tickets
          </div>
          <div className="mt-4 space-y-3">
            {relatedTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-line bg-panelSoft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ticket.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {ticket.code}
                    </p>
                  </div>
                  <span className="rounded-full border border-line bg-white px-2 py-1 text-xs text-slate-600">
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {ticket.businessSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
