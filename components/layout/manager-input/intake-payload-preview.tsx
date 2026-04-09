"use client";

import type { ManagerIntakePayload } from "@/lib/domain/models";

type IntakePayloadPreviewProps = {
  payload: ManagerIntakePayload | null;
};

export function IntakePayloadPreview({ payload }: IntakePayloadPreviewProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Debug Payload Preview
      </div>

      {payload ? (
        <div className="mt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Project Name
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {payload.projectName}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Output Settings
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {payload.targetOutputLanguage} / Repo Context:{" "}
                {payload.includeRepoContext ? "On" : "Off"}
              </p>
            </div>
          </div>

          <pre className="overflow-x-auto rounded-xl border border-line bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Submit the intake form to generate a local structured payload preview.
        </p>
      )}
    </div>
  );
}
