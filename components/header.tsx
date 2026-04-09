import { RoleSwitcher } from "@/components/role-switcher";
import type { AppRole, Project } from "@/lib/domain/models";

type HeaderProps = {
  project: Project;
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
};

const roleDescriptions: Record<AppRole, string> = {
  manager: "Delivery health, blockers, team continuity, and Jira sync trust.",
  analyst: "Business scope, open questions, and cross-role translation.",
  developer: "Source-aware tickets, technical summaries, repo impact, and handover detail."
};

export function Header({
  project,
  currentRole,
  onRoleChange,
  onResetDemo,
  isResetting
}: HeaderProps) {
  return (
    <header className="rounded-xl2 border border-line bg-panel px-6 py-6 shadow-panel">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-panelSoft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              BridgeFlow
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accentMuted">
              {project.code}
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">
              {project.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {project.objective}
            </p>
          </div>
        </div>

        <div className="grid gap-3 xl:min-w-[480px]">
          <div className="rounded-xl2 border border-line bg-panelSoft p-4 shadow-panelSoft">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accentMuted">
                  Working Perspective
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {roleDescriptions[currentRole]}
                </p>
              </div>
              <RoleSwitcher currentRole={currentRole} onRoleChange={onRoleChange} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-white px-4 py-3 shadow-panelSoft">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600">
                {project.primaryView === "kanban" ? "Board-first demo" : "Demo mode"}
              </span>
              <span className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600">
                Languages: {project.languages.join(" / ")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void onResetDemo()}
              disabled={isResetting}
              className="rounded-full border border-line bg-accentSoft px-3.5 py-2 text-xs font-semibold text-accent transition disabled:cursor-not-allowed disabled:text-slate-400 hover:bg-white"
            >
              {isResetting ? "Resetting demo..." : "Reset Demo Scenario"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
