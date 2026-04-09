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
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1 shadow-panelSoft">
      {roleOptions.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onRoleChange(role.id)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            currentRole === role.id
              ? "bg-ink text-white"
              : "text-slate-500 hover:bg-panelSoft"
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
