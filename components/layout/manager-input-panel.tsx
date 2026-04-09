import { ShellPanel } from "@/components/ui/shell-panel";

const notes = [
  "Paste multilingual project notes or a rough request.",
  "Capture business context, deadlines, and constraints.",
  "Review structured intake before generating tickets."
];

export function ManagerInputPanel() {
  return (
    <ShellPanel
      title="Manager Input"
      description="Entry point for project notes, assumptions, and business context."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-line bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Paste Project Brief</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Example: Extend the loan calculator, keep compliance text aligned, and
            coordinate frontend, backend, and QA updates across English and German notes.
          </p>
        </div>

        <ul className="space-y-2 text-sm text-slate-600">
          {notes.map((note) => (
            <li
              key={note}
              className="rounded-xl border border-line bg-white px-3 py-2"
            >
              {note}
            </li>
          ))}
        </ul>

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
