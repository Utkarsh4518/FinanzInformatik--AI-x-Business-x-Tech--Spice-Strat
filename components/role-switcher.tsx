import type { AppRole } from "@/lib/domain/models";

type RoleSwitcherProps = {
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
};

const roleOptions: { id: AppRole; label: string }[] = [
  { id: "manager", label: "Manager" },
  { id: "analyst", label: "Analyst" },
  { id: "developer", label: "Developer" }
];

export function RoleSwitcher({
  currentRole,
  onRoleChange
}: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-panelSoft p-1 shadow-panelSoft">
      {roleOptions.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onRoleChange(role.id)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            currentRole === role.id
              ? "bg-accent text-white shadow-sm"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
