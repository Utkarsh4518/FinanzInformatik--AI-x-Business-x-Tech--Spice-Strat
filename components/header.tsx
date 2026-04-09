import type { Project } from "@/lib/domain/models";

type HeaderProps = {
  project: Project;
};

export function Header({ project }: HeaderProps) {
  return (
    <header className="rounded-xl2 border border-line bg-panel px-5 py-4 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            {project.code}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-ink">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {project.objective}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-teal-200 bg-accentSoft px-3 py-1 text-xs font-medium text-teal-800">
            {project.primaryView === "kanban" ? "Board First" : "Demo Mode"}
          </div>
          <button
            type="button"
            className="flex min-w-36 items-center justify-between rounded-full border border-line bg-white px-4 py-2 text-sm text-slate-600"
          >
            <span>Languages: {project.languages.join(" / ")}</span>
            <span aria-hidden="true">v</span>
          </button>
        </div>
      </div>
    </header>
  );
}
