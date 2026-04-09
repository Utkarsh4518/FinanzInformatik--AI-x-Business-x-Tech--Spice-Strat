import { ShellPanel } from "@/components/ui/shell-panel";
import type {
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket
} from "@/lib/domain/models";

type AIInsightsPanelProps = {
  project: Project;
  handover: Handover;
  repoFileSummaries: RepoFileSummary[];
  teamMembers: TeamMember[];
  tickets: Ticket[];
};

export function AIInsightsPanel({
  project,
  handover,
  repoFileSummaries,
  teamMembers,
  tickets
}: AIInsightsPanelProps) {
  const unavailableMember = teamMembers.find(
    (member) => member.id === handover.unavailableMemberId
  );
  const fallbackOwner = teamMembers.find(
    (member) => member.id === handover.fallbackOwnerId
  );
  const handoverTickets = tickets.filter((ticket) =>
    handover.openTicketIds.includes(ticket.id)
  );
  const insightBlocks = [
    {
      label: "Business Summary",
      text: project.businessSummary
    },
    {
      label: "Technical Translation",
      text: project.technicalSummary
    },
    {
      label: "Manager Summary",
      text: project.managerSummary
    }
  ];

  return (
    <ShellPanel
      title="AI Insights"
      description="Space for summaries, translations, and handover support."
    >
      <div className="space-y-3">
        {insightBlocks.map((block) => (
          <div
            key={block.label}
            className="rounded-2xl border border-line bg-slate-50 p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              {block.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{block.text}</p>
          </div>
        ))}

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Handover Status
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{handover.summary}</p>
          <div className="mt-3 text-sm text-slate-500">
            <p>Unavailable teammate: {unavailableMember?.name ?? "Unknown"}</p>
            <p>Fallback owner: {fallbackOwner?.name ?? "Unknown"}</p>
          </div>
          <div className="mt-3 space-y-2">
            {handoverTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-line bg-slate-50 p-3">
                <p className="font-medium text-slate-700">{ticket.code}</p>
                <p className="mt-1 text-sm text-slate-500">{ticket.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Repo Impact Snapshot
          </div>
          <div className="mt-3 space-y-2">
            {repoFileSummaries.map((file) => (
              <div key={file.id} className="rounded-xl border border-line bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">{file.path}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {file.area}
                </p>
                <p className="mt-2 text-sm text-slate-500">{file.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
