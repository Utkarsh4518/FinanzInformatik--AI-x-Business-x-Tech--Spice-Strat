import type { Project } from "@/lib/domain/models";

type HeaderProps = {
  project: Project;
};

export function Header({ project }: HeaderProps) {
  return (
    <header className="rounded-xl2 border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] px-6 py-5 shadow-panel backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            {project.code}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            {project.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {project.objective}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {project.primaryView === "kanban" ? "Board First" : "Demo Mode"}
          </div>
          <button
            type="button"
            className="flex min-w-40 items-center justify-between rounded-full border border-line bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"
          >
            <span>Languages: {project.languages.join(" / ")}</span>
            <span aria-hidden="true">v</span>
          </button>
        </div>
      </div>
    </header>
  );
}
