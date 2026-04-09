import { ShellPanel } from "@/components/ui/shell-panel";
import type { Project, TeamMember, TicketComment } from "@/lib/domain/models";

type ManagerInputPanelProps = {
  project: Project;
  teamMembers: TeamMember[];
  ticketComments: TicketComment[];
};

const availabilityStyles: Record<TeamMember["availabilityStatus"], string> = {
  available: "bg-emerald-50 text-emerald-700",
  busy: "bg-amber-50 text-amber-700",
  unavailable: "bg-rose-50 text-rose-700"
};

export function ManagerInputPanel({
  project,
  teamMembers,
  ticketComments
}: ManagerInputPanelProps) {
  return (
    <ShellPanel
      title="Manager Input"
      description="Entry point for project notes, assumptions, and business context."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Current Project Brief</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {project.managerBrief}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Project Setup
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Primary view: {project.primaryView}</p>
            <p>Secondary view: {project.secondaryView}</p>
            <p>Working languages: {project.languages.join(", ")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Team Availability
          </div>
          <div className="mt-3 space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-line px-3 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-700">{member.name}</p>
                    <p className="text-slate-500">{member.role.replaceAll("_", " ")}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${availabilityStyles[member.availabilityStatus]}`}
                  >
                    {member.availabilityStatus}
                  </span>
                </div>
                <p className="mt-2 text-slate-500">{member.focus}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recent Team Signals
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {ticketComments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-line bg-slate-50 p-3">
                <p className="leading-6">{comment.message}</p>
                <p className="mt-2 text-xs text-slate-400">{comment.createdAt}</p>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white"
        >
          Generate Structured Intake
        </button>
      </div>
    </ShellPanel>
  );
}
