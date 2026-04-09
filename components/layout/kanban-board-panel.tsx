import { ShellPanel } from "@/components/ui/shell-panel";

const columns = [
  {
    title: "Backlog",
    items: ["Clarify manager notes", "Define scope boundaries"]
  },
  {
    title: "In Progress",
    items: ["Draft loan calculator tickets", "Translate business rules"]
  },
  {
    title: "Review",
    items: ["Validate summary wording"]
  },
  {
    title: "Done",
    items: ["Create intake template"]
  }
];

export function KanbanBoardPanel() {
  return (
    <ShellPanel
      title="Kanban Board"
      description="Primary delivery view for generated work items and current status."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.title}
            className="rounded-2xl border border-line bg-slate-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{column.title}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                {column.items.length}
              </span>
            </div>

            <div className="space-y-3">
              {column.items.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-line bg-white p-3 text-sm text-slate-600 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShellPanel>
  );
}
