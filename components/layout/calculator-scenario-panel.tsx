import { ShellPanel } from "@/components/ui/shell-panel";
import type { Project, RepoFileSummary, Ticket } from "@/lib/domain/models";

type CalculatorScenarioPanelProps = {
  project: Project;
  tickets: Ticket[];
  repoFileSummaries: RepoFileSummary[];
};

export function CalculatorScenarioPanel({
  project,
  tickets,
  repoFileSummaries
}: CalculatorScenarioPanelProps) {
  const relatedTickets = tickets
    .filter(
      (ticket) =>
        ticket.title.toLowerCase().includes("loan") ||
        ticket.description.toLowerCase().includes("loan") ||
        ticket.businessSummary.toLowerCase().includes("calculator")
    )
    .slice(0, 5);
  const likelyRepoSurfaces = repoFileSummaries.slice(0, 4);
  const jiraTicketCount = tickets.filter((ticket) => ticket.sourceType === "jira").length;

  return (
    <ShellPanel
      title="Calculator Scenario"
      description="Presentation-ready framing for the loan calculator extension, cross-role collaboration, and the Jira-aware BridgeFlow workflow."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-panelSoft p-6">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Demo Story
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">
                Extend the loan calculator with loan term calculation
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                BridgeFlow shows how one persisted workspace can turn messy multilingual notes and imported Jira work into structured tickets, role-aware summaries, and safer execution handoffs.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Current Surface
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Existing loan calculator with payment-oriented outputs
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  New Capability
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Loan term calculation from payment inputs and business rules
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Why BridgeFlow
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Align scope, delivery detail, Jira sync visibility, and continuity risk
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Jira-backed Tasks
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {jiraTicketCount} imported issue{jiraTicketCount === 1 ? "" : "s"} available in the same workflow
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Current Calculator Context
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {project.businessSummary}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                New Loan Term Feature
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                The new feature lets users derive loan term from payment-driven inputs instead of only reviewing payment outputs. That expands the work surface across business rules, validation, UI wording, calculation logic, and QA expectations.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Why Business-Tech Collaboration Is Needed
              </div>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <li>Managers need a health view with blockers, sync trust, and continuity risk.</li>
                <li>Analysts need multilingual notes normalized into business scope and open questions.</li>
                <li>Developers need source-aware tickets, likely code impact, and handover-ready delivery detail.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                How BridgeFlow Helps
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-600">
                  Organizes messy notes into role-aware tickets, summaries, and next steps.
                </div>
                <div className="rounded-xl border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-600">
                  Keeps imported Jira issues and local work visible in one persisted workspace.
                </div>
                <div className="rounded-xl border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-600">
                  Supports translation, progress summaries, handovers, and repo impact from the same task context.
                </div>
                <div className="rounded-xl border border-line bg-panelSoft p-4 text-sm leading-6 text-slate-600">
                  Makes the live demo credible by showing one coherent business-to-tech operating surface.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Related Workflow Touchpoints
              </div>
              <div className="mt-4 space-y-3">
                {relatedTickets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-panelSoft p-4 text-sm text-slate-500">
                    No tickets matching the calculator scenario filter yet. Use the Project Brief to organize raw notes and generate workflow tickets.
                  </div>
                ) : null}
                {relatedTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-line bg-panelSoft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{ticket.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                          {ticket.code} - {ticket.sourceType === "jira" ? ticket.externalKey ?? "jira" : "local"}
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

            <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                Likely Repo Surfaces
              </div>
              <div className="mt-4 space-y-3">
                {likelyRepoSurfaces.map((file) => (
                  <div key={file.id} className="rounded-xl border border-line bg-panelSoft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{file.path}</p>
                      <span className="rounded-full border border-line bg-white px-2 py-1 text-xs text-slate-600">
                        {(file.tags ?? []).slice(0, 2).join(" / ") || "repo surface"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{file.summary}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Use the Repo Impact workspace with a selected ticket to turn this curated context into a more specific affected-file analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
