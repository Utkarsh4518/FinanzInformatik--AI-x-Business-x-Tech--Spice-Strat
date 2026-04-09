type WorkspaceTab =
  | "overview"
  | "tasks"
  | "insights"
  | "handover"
  | "repo-impact"
  | "calculator-scenario";

type WorkspaceTabsProps = {
  activeTab: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
};

const tabLabels: { id: WorkspaceTab; label: string; hint?: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "insights", label: "Insights" },
  { id: "handover", label: "Handover", hint: "· Manager" },
  { id: "repo-impact", label: "Repo Impact", hint: "· Developer" },
  { id: "calculator-scenario", label: "Calculator Scenario" }
];

export type { WorkspaceTab };

export function WorkspaceTabs({ activeTab, onChange }: WorkspaceTabsProps) {
  return (
    <div className="rounded-xl2 border border-line bg-panel px-3 py-3 shadow-panelSoft">
      <div className="flex flex-wrap gap-2">
        {tabLabels.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-accent bg-accentSoft text-accent shadow-panelSoft"
                : "border-transparent bg-panel text-slate-600 hover:border-line hover:bg-panelSoft"
            }`}
          >
            {tab.label}
            {tab.hint ? (
              <span className="ml-1 text-[10px] font-medium text-slate-400">{tab.hint}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
