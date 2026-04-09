"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApiItemResponse,
  CreateHandoverRequest,
  GenerateHandoverRequest,
  GenerateHandoverResponse
} from "@/lib/domain/api";
import type {
  AppRole,
  Handover,
  TeamMember,
  Ticket,
  TicketComment
} from "@/lib/domain/models";

type TicketHandoverSectionProps = {
  currentRole: AppRole;
  projectId: string;
  projectSummary: string;
  ticket: Ticket;
  teamMembers: TeamMember[];
  comments: TicketComment[];
  handovers: Handover[];
  onSaveHandover: (input: CreateHandoverRequest) => Promise<void>;
};

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim())));
}

export function TicketHandoverSection({
  currentRole,
  projectId,
  projectSummary,
  ticket,
  teamMembers,
  comments,
  handovers,
  onSaveHandover
}: TicketHandoverSectionProps) {
  const [nextAssigneeId, setNextAssigneeId] = useState("");
  const [generated, setGenerated] = useState<GenerateHandoverResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAssignee =
    teamMembers.find((member) => member.id === ticket.assigneeId) ?? null;
  const selectedNextAssignee =
    teamMembers.find((member) => member.id === nextAssigneeId) ?? null;
  const ticketHandovers = useMemo(
    () => handovers.filter((handover) => handover.openTicketIds.includes(ticket.id)),
    [handovers, ticket.id]
  );

  useEffect(() => {
    setNextAssigneeId("");
    setGenerated(null);
    setError(null);
  }, [ticket.id]);

  const suggestedOwner =
    teamMembers.find((member) => member.name === generated?.suggestedNextOwner) ??
    selectedNextAssignee ??
    null;

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/ai/generate-handover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ticket,
          currentAssignee,
          nextAssignee: selectedNextAssignee,
          teamMembers,
          ticketComments: comments,
          projectSummary,
          currentRoleView: currentRole,
          relatedBlockerContext: ticket.blockerReason
        } satisfies GenerateHandoverRequest)
      });

      if (!response.ok) {
        throw new Error("Handover generation failed.");
      }

      const payload =
        (await response.json()) as ApiItemResponse<GenerateHandoverResponse>;
      setGenerated(payload.data);

      const generatedOwner = teamMembers.find(
        (member) => member.name === payload.data.suggestedNextOwner
      );

      if (!selectedNextAssignee && generatedOwner) {
        setNextAssigneeId(generatedOwner.id);
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Handover generation failed."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!generated) {
      return;
    }

    const fallbackOwner =
      selectedNextAssignee ??
      teamMembers.find((member) => member.name === generated.suggestedNextOwner) ??
      teamMembers.find(
        (member) =>
          member.id !== (currentAssignee?.id ?? ticket.assigneeId) &&
          member.availabilityStatus !== "unavailable"
      ) ??
      null;

    if (!fallbackOwner) {
      setError("No available fallback owner could be resolved for this handover.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSaveHandover({
        projectId,
        unavailableMemberId: currentAssignee?.id ?? ticket.assigneeId,
        fallbackOwnerId: fallbackOwner.id,
        summary: generated.summary,
        openTicketIds: [ticket.id],
        blockers: uniqueItems([
          ticket.blockerReason,
          ...generated.unresolvedQuestions
        ])
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Handover save failed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const roleSpecificView =
    currentRole === "manager" ? (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Continuity Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{generated?.summary}</p>
        </div>
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Impact
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {generated?.businessFacingSummary}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Suggested next owner: {generated?.suggestedNextOwner}
          </p>
        </div>
      </div>
    ) : currentRole === "analyst" ? (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business-Facing Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {generated?.businessFacingSummary}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Unresolved Questions
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {generated?.unresolvedQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Completed Work
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {generated?.completedWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Remaining Work
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {generated?.remainingWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Next Steps And Questions
          </div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {[...(generated?.suggestedNextSteps ?? []), ...(generated?.unresolvedQuestions ?? [])].map(
              (item) => (
                <li key={item}>{item}</li>
              )
            )}
          </ul>
        </div>
      </div>
    );

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            AI Handover
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate a reassignment-ready handover for this ticket and save it through
            the existing handover record flow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {isGenerating ? "Generating..." : "Generate Handover"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-slate-50/90 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Current Assignee
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {currentAssignee?.name ?? "Unassigned"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            {currentAssignee?.availabilityStatus ?? "unknown"}
          </p>
        </div>

        <label className="rounded-xl border border-line bg-slate-50/90 p-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Next Assignee Override
          </span>
          <select
            value={nextAssigneeId}
            onChange={(event) => setNextAssigneeId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="">Auto-suggest next owner</option>
            {teamMembers
              .filter((member) => member.id !== (currentAssignee?.id ?? ticket.assigneeId))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.availabilityStatus} - {member.capacityPercent}%
                </option>
              ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {generated ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Generated Output
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Suggested next owner: {suggestedOwner?.name ?? generated.suggestedNextOwner}
              </p>
            </div>
            <div className="p-4">{roleSpecificView}</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {isSaving ? "Saving..." : "Save Handover Record"}
            </button>
          </div>
        </div>
      ) : null}

      {ticketHandovers.length ? (
        <div className="mt-4 rounded-xl border border-line bg-slate-50/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Saved Handovers For This Ticket
          </div>
          <div className="mt-3 space-y-3">
            {ticketHandovers.map((handover) => {
              const owner =
                teamMembers.find((member) => member.id === handover.fallbackOwnerId) ?? null;

              return (
                <div key={handover.id} className="rounded-xl border border-line bg-white p-3">
                  <p className="text-sm leading-6 text-slate-700">{handover.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Fallback owner: {owner?.name ?? "Unknown"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
