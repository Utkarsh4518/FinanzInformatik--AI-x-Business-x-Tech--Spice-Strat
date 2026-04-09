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
    <div className="flex items-center gap-2 rounded-full border border-line bg-white p-1 shadow-sm">
      {roleOptions.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onRoleChange(role.id)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            currentRole === role.id
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
