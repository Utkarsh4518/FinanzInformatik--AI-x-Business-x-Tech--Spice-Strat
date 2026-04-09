"use client";

import { useEffect, useState } from "react";

import { TicketHandoverSection } from "@/components/layout/ticket-detail/ticket-handover-section";
import { TicketRepoImpactSection } from "@/components/layout/ticket-detail/ticket-repo-impact-section";
import type {
  CreateHandoverRequest,
  CreateTicketCommentRequest
} from "@/lib/domain/api";
import type {
  AppRole,
  Handover,
  RepoFileSummary,
  TeamMember,
  Ticket,
  TicketComment,
  TicketStatus,
  TicketUpdateInput
} from "@/lib/domain/models";

type TicketDetailPanelProps = {
  ticket: Ticket | null;
  currentRole: AppRole;
  projectId: string;
  projectSummary: string;
  teamMembers: TeamMember[];
  comments: TicketComment[];
  handovers: Handover[];
  repoFileSummaries: RepoFileSummary[];
  onClose: () => void;
  onUpdate: (ticketId: string, updates: TicketUpdateInput) => Promise<void>;
  onCreateComment: (
    ticketId: string,
    input: CreateTicketCommentRequest
  ) => Promise<void>;
  onSaveHandover: (input: CreateHandoverRequest) => Promise<void>;
};

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" }
];

export function TicketDetailPanel({
  ticket,
  currentRole,
  projectId,
  projectSummary,
  teamMembers,
  comments,
  handovers,
  repoFileSummaries,
  onClose,
  onUpdate,
  onCreateComment,
  onSaveHandover
}: TicketDetailPanelProps) {
  const [authorId, setAuthorId] = useState(teamMembers[0]?.id ?? "");
  const [commentMessage, setCommentMessage] = useState("");
  const [blockerDraft, setBlockerDraft] = useState(ticket?.blockerReason ?? "");

  useEffect(() => {
    setAuthorId((currentAuthorId) => currentAuthorId || teamMembers[0]?.id || "");
  }, [teamMembers]);

  useEffect(() => {
    setBlockerDraft(ticket?.blockerReason ?? "");
  }, [ticket?.blockerReason, ticket?.id]);

  async function handleCommentSubmit() {
    if (!ticket || !authorId || !commentMessage.trim()) {
      return;
    }

    await onCreateComment(ticket.id, {
      authorId,
      message: commentMessage
    });

    setCommentMessage("");
  }

  async function handleBlockerCommit() {
    if (!ticket || blockerDraft === ticket.blockerReason) {
      return;
    }

    await onUpdate(ticket.id, {
      status: ticket.status,
      assigneeId: ticket.assigneeId,
      blockerReason: blockerDraft
    });
  }

  if (!ticket) {
    return (
      <div className="rounded-xl2 border border-line bg-panel/95 p-5 shadow-panel">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ticket Detail
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Select a ticket from the board or table to inspect and edit its local state.
        </p>
      </div>
    );
  }

  const authorNameById = new Map(teamMembers.map((member) => [member.id, member.name]));
  const assignee = teamMembers.find((member) => member.id === ticket.assigneeId) ?? null;
  const dependencyItems = ticket.dependencies.length
    ? ticket.dependencies
    : ["No explicit dependencies recorded."];
  const blockerLabel = ticket.blockerReason || "No blocker currently recorded.";
  const roleSummaryTitle =
    currentRole === "manager"
      ? "Delivery Snapshot"
      : currentRole === "analyst"
        ? "Business Context"
        : "Engineering Focus";
  const roleSummaryBody =
    currentRole === "manager"
      ? ticket.businessSummary
      : currentRole === "analyst"
        ? ticket.description
        : ticket.technicalSummary;

  return (
    <div className="rounded-xl2 border border-line bg-panel/95 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ticket Detail
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{ticket.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            {ticket.code}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
            className="rounded-full border border-line px-3 py-1 text-sm text-slate-500 shadow-sm"
        >
          Close
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-line bg-slate-50/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {roleSummaryTitle}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{roleSummaryBody}</p>
        </div>

        {currentRole !== "analyst" ? (
          <div className="rounded-2xl border border-line bg-slate-50/90 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Business Summary
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {ticket.businessSummary}
            </p>
          </div>
        ) : null}

        {currentRole !== "developer" ? (
          <div className="rounded-2xl border border-line bg-slate-50/90 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Description
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-line bg-slate-50/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Technical Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {ticket.technicalSummary}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Priority
            </div>
            <p className="mt-2 text-sm font-medium capitalize text-slate-700">
              {ticket.priority}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Assignee Detail
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {assignee?.name ?? "Unassigned"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
              {assignee?.role ?? "No role assigned"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-line bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={ticket.status}
              onChange={(event) =>
                void onUpdate(ticket.id, {
                  status: event.target.value as TicketStatus,
                  assigneeId: ticket.assigneeId,
                  blockerReason: ticket.blockerReason
                })
              }
              className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-2xl border border-line bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Assignee
            </span>
            <select
              value={ticket.assigneeId}
              onChange={(event) =>
                void onUpdate(ticket.id, {
                  status: ticket.status,
                  assigneeId: event.target.value,
                  blockerReason: ticket.blockerReason
                })
              }
              className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {currentRole === "developer" ? "Blocker Detail" : "Blocker Reason"}
          </span>
          <textarea
            value={blockerDraft}
            onChange={(event) => setBlockerDraft(event.target.value)}
            onBlur={() => void handleBlockerCommit()}
            rows={4}
            placeholder="No blocker currently recorded."
            className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400"
          />
        </label>

        {currentRole === "developer" ? (
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Dependencies
            </div>
            <div className="mt-3 space-y-2">
              {dependencyItems.map((dependency) => (
                <div
                  key={dependency}
                  className="rounded-xl border border-line bg-slate-50/90 p-3 text-sm text-slate-600"
                >
                  {dependency}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentRole === "manager" ? (
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Delivery Readout
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-slate-50/90 p-3 text-sm text-slate-600">
                Overall owner
                <div className="mt-2 font-medium text-slate-800">
                  {assignee?.name ?? "Unassigned"}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-slate-50/90 p-3 text-sm text-slate-600">
                Current blocker
                <div className="mt-2 font-medium text-slate-800">{blockerLabel}</div>
              </div>
            </div>
          </div>
        ) : null}

        <TicketHandoverSection
          currentRole={currentRole}
          projectId={projectId}
          projectSummary={projectSummary}
          ticket={ticket}
          teamMembers={teamMembers}
          comments={comments}
          handovers={handovers}
          onSaveHandover={onSaveHandover}
        />

        <TicketRepoImpactSection
          currentRole={currentRole}
          ticket={ticket}
          repoFileSummaries={repoFileSummaries}
        />

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ticket Comments
          </div>

          <div className="mt-3 space-y-2">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-line bg-slate-50/90 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">
                      {authorNameById.get(comment.authorId) ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400">{comment.createdAt}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {comment.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No comments yet.</p>
            )}
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-dashed border-line bg-slate-50 p-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Comment Author
              </span>
              <select
                value={authorId}
                onChange={(event) => setAuthorId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                New Comment
              </span>
              <textarea
                value={commentMessage}
                onChange={(event) => setCommentMessage(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCommentSubmit()}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
