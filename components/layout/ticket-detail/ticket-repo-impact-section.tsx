"use client";

import { useState } from "react";

import type {
  ApiItemResponse,
  RepoImpactRequest,
  RepoImpactResponse
} from "@/lib/domain/api";
import type { AppRole, RepoFileSummary, Ticket } from "@/lib/domain/models";

type TicketRepoImpactSectionProps = {
  currentRole: AppRole;
  ticket: Ticket;
  repoFileSummaries: RepoFileSummary[];
};

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function TicketRepoImpactSection({
  currentRole,
  ticket,
  repoFileSummaries
}: TicketRepoImpactSectionProps) {
  const [result, setResult] = useState<RepoImpactResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch("/api/ai/repo-impact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedTicket: ticket,
          repoFileSummaries,
          currentRoleView: currentRole
        } satisfies RepoImpactRequest)
      });

      if (!response.ok) {
        throw new Error("Repo impact analysis failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<RepoImpactResponse>;
      setResult(payload.data);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Repo impact analysis failed."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Repo Impact
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Estimate which curated local files are most likely affected by this ticket.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs font-medium text-slate-600">
            {isAnalyzing ? "Analyzing" : result ? "Ready" : "Awaiting input"}
          </span>
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing}
            className="rounded-xl border border-line bg-panelSoft px-4 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:text-slate-400 hover:bg-white"
          >
            {isAnalyzing ? "Analyzing..." : "Run Repo Impact"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error} The curated repo context is still available for manual review.
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-line bg-panelSoft p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Overall Impact Summary
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {result.overallImpactSummary}
            </p>
          </div>

          <div className="space-y-3">
            {result.relevantFiles.map((file) => {
              const repoContext =
                repoFileSummaries.find((entry) => entry.path === file.path) ?? null;

              return (
                <div key={file.path} className="rounded-xl border border-line bg-panelSoft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{file.path}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {repoContext?.area ?? "Repo Surface"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {formatConfidence(file.confidenceScore)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">{file.reason}</p>

                  {currentRole === "developer" ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-slate-500">
                        {repoContext?.excerpt ?? repoContext?.summary}
                      </p>
                      {(repoContext?.tags ?? []).length ? (
                        <div className="flex flex-wrap gap-2">
                          {(repoContext?.tags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-line bg-white px-2 py-1 text-xs text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : currentRole === "analyst" ? (
                    <p className="mt-3 text-sm text-slate-500">
                      This affects the {repoContext?.area ?? "related product surface"} area
                      and is likely visible in how the ticket is explained or reviewed.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      This is part of the likely implementation surface for the selected
                      scope item and helps estimate how broad the change may be.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : !error ? (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-panelSoft p-4 text-sm text-slate-500">
          Run repo impact to estimate which curated loan-calculator files are most likely affected by this ticket. If analysis falls back, the curated repo context still supports a reliable live demo.
        </div>
      ) : null}
    </div>
  );
}
