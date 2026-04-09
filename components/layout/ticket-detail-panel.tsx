"use client";

import { useEffect, useState } from "react";

import type { CreateTicketCommentRequest } from "@/lib/domain/api";
import type {
  TeamMember,
  Ticket,
  TicketComment,
  TicketStatus,
  TicketUpdateInput
} from "@/lib/domain/models";

type TicketDetailPanelProps = {
  ticket: Ticket | null;
  teamMembers: TeamMember[];
  comments: TicketComment[];
  onClose: () => void;
  onUpdate: (ticketId: string, updates: TicketUpdateInput) => Promise<void>;
  onCreateComment: (
    ticketId: string,
    input: CreateTicketCommentRequest
  ) => Promise<void>;
};

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" }
];

export function TicketDetailPanel({
  ticket,
  teamMembers,
  comments,
  onClose,
  onUpdate,
  onCreateComment
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
            Description
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
        </div>

        <div className="rounded-2xl border border-line bg-slate-50/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Summary
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {ticket.businessSummary}
          </p>
        </div>

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
        </div>

        <label className="block rounded-2xl border border-line bg-white p-4">
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

        <label className="block rounded-2xl border border-line bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blocker Reason
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
