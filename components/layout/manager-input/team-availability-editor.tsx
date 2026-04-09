"use client";

import type { AvailabilityStatus, TeamAvailabilityInput } from "@/lib/domain/models";

type TeamAvailabilityEditorProps = {
  member: TeamAvailabilityInput;
  onAvailabilityChange: (memberId: string, status: AvailabilityStatus) => void;
  onCapacityChange: (memberId: string, capacityPercent: number) => void;
};

const availabilityOptions: AvailabilityStatus[] = [
  "available",
  "busy",
  "unavailable"
];

const availabilityStyles: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  busy: "bg-amber-50 text-amber-700",
  unavailable: "bg-rose-50 text-rose-700"
};

export function TeamAvailabilityEditor({
  member,
  onAvailabilityChange,
  onCapacityChange
}: TeamAvailabilityEditorProps) {
  return (
    <div className="rounded-xl border border-line bg-panelSoft p-4 shadow-panelSoft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-700">{member.name}</p>
          <p className="text-sm capitalize text-slate-500">
            {member.role.replaceAll("_", " ")}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${availabilityStyles[member.availabilityStatus]}`}
        >
          {member.availabilityStatus}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Availability
          </span>
          <select
            value={member.availabilityStatus}
            onChange={(event) =>
              onAvailabilityChange(
                member.memberId,
                event.target.value as AvailabilityStatus
              )
            }
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            {availabilityOptions.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Capacity
            </span>
            <span className="text-sm font-medium text-slate-600">
              {member.capacityPercent}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={member.capacityPercent}
            onChange={(event) =>
              onCapacityChange(member.memberId, Number(event.target.value))
            }
            className="mt-3 h-2 w-full cursor-pointer accent-slate-800"
          />
        </label>
      </div>
    </div>
  );
}
