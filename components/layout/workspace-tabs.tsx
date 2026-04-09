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

const tabLabels: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "insights", label: "Insights" },
  { id: "handover", label: "Handover" },
  { id: "repo-impact", label: "Repo Impact" },
  { id: "calculator-scenario", label: "Calculator Scenario" }
];

export type { WorkspaceTab };

export function WorkspaceTabs({ activeTab, onChange }: WorkspaceTabsProps) {
  return (
    <div className="rounded-xl2 border border-line bg-panel p-2 shadow-panelSoft">
      <div className="flex flex-wrap gap-2">
        {tabLabels.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-accent text-white shadow-panelSoft"
                : "bg-panelSoft text-slate-600 hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
