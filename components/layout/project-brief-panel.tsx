import type { Project, TeamMember, Ticket } from "@/lib/domain/models";

type ProjectBriefPanelProps = {
  project: Project;
  teamMembers: TeamMember[];
  tickets: Ticket[];
  onEditIntake: () => void;
};

export function ProjectBriefPanel({
  project,
  teamMembers,
  tickets,
  onEditIntake
}: ProjectBriefPanelProps) {
  const blockedCount = tickets.filter((ticket) => ticket.blockerReason.trim()).length;
  const inFlightCount = tickets.filter(
    (ticket) => ticket.status === "in_progress" || ticket.status === "review"
  ).length;
  const unavailableCount = teamMembers.filter(
    (member) => member.availabilityStatus === "unavailable"
  ).length;

  return (
    <section className="rounded-xl2 border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accentMuted">
            Project Brief
          </div>
          <h2 className="mt-2 text-base font-semibold text-ink">{project.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{project.managerBrief}</p>
        </div>

        <button
          type="button"
          onClick={onEditIntake}
          className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
        >
          Edit Intake
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
            Collaboration Context
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {project.businessSummary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">In Flight</div>
            <div className="mt-2 text-lg font-semibold text-ink">{inFlightCount}</div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Blocked</div>
            <div className="mt-2 text-lg font-semibold text-rose-700">{blockedCount}</div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Unavailable</div>
            <div className="mt-2 text-lg font-semibold text-amber-700">
              {unavailableCount}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
