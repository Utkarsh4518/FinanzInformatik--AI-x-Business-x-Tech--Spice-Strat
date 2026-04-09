import { RoleSwitcher } from "@/components/role-switcher";
import type { AppRole, Project } from "@/lib/domain/models";

type HeaderProps = {
  project: Project;
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
};

export function Header({
  project,
  currentRole,
  onRoleChange,
  onResetDemo,
  isResetting
}: HeaderProps) {
  return (
    <header className="rounded-xl2 border border-line bg-panel px-6 py-5 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-accentMuted">
            {project.code}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{project.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {project.objective}
          </p>
        </div>

        <div className="grid gap-3 lg:min-w-[420px]">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panelSoft p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accentMuted">
                  Working Perspective
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Switch the same workspace between manager, analyst, and developer emphasis.
                </p>
              </div>
              <RoleSwitcher currentRole={currentRole} onRoleChange={onRoleChange} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600">
              {project.primaryView === "kanban" ? "Board-first demo" : "Demo mode"}
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600">
              Languages: {project.languages.join(" / ")}
            </span>
            <button
              type="button"
              onClick={() => void onResetDemo()}
              disabled={isResetting}
              className="rounded-full border border-accent/20 bg-accentSoft px-3 py-2 text-xs font-semibold text-accent transition disabled:cursor-not-allowed disabled:text-slate-400 hover:bg-white"
            >
              {isResetting ? "Resetting demo..." : "Reset Demo Scenario"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
