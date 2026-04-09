import { ShellPanel } from "@/components/ui/shell-panel";

const insightBlocks = [
  {
    label: "Business Summary",
    text: "Loan calculator extension affects UX copy, calculation rules, and stakeholder review."
  },
  {
    label: "Technical Translation",
    text: "Likely frontend form updates, rule validation changes, and regression testing around edge cases."
  },
  {
    label: "Handover Placeholder",
    text: "Current owner can hand off open tickets, blockers, and recent decisions in one generated brief."
  }
];

export function AIInsightsPanel() {
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

        <div className="rounded-2xl border border-dashed border-line bg-white p-4 text-sm text-slate-500">
          AI generation is not connected yet. This panel is a visual placeholder for the
          next batch.
        </div>
      </div>
    </ShellPanel>
  );
}
