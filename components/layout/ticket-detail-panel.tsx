"use client";

import { useEffect, useState } from "react";

import { TranslateTab } from "@/components/layout/ai-insights/translate-tab";
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
  managerRawInput: string;
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

type DetailTab = "details" | "comments" | "translate" | "handover" | "repo-impact";

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "comments", label: "Comments" },
  { id: "translate", label: "Translate" },
  { id: "handover", label: "Handover" },
  { id: "repo-impact", label: "Repo Impact" }
];

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" }
];

const priorityStyles: Record<Ticket["priority"], string> = {
  low: "border border-line bg-panelSoft text-slate-600",
  medium: "border border-accent/10 bg-accentSoft text-accent",
  high: "border border-amber-200 bg-amber-50 text-amber-700",
  critical: "border border-rose-200 bg-rose-50 text-rose-700"
};

export function TicketDetailPanel({
  ticket,
  currentRole,
  projectId,
  projectSummary,
  managerRawInput,
  teamMembers,
  comments,
  handovers,
  repoFileSummaries,
  onClose,
  onUpdate,
  onCreateComment,
  onSaveHandover
}: TicketDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [authorId, setAuthorId] = useState(teamMembers[0]?.id ?? "");
  const [commentMessage, setCommentMessage] = useState("");
  const [blockerDraft, setBlockerDraft] = useState(ticket?.blockerReason ?? "");

  useEffect(() => {
    setAuthorId((currentAuthorId) => currentAuthorId || teamMembers[0]?.id || "");
  }, [teamMembers]);

  useEffect(() => {
    setBlockerDraft(ticket?.blockerReason ?? "");
    setActiveTab("details");
    setCommentMessage("");
  }, [ticket?.blockerReason, ticket?.id]);

  if (!ticket) {
    return null;
  }

  const currentTicket = ticket;
  const authorNameById = new Map(teamMembers.map((member) => [member.id, member.name]));
  const assignee =
    teamMembers.find((member) => member.id === currentTicket.assigneeId) ?? null;
  const dependencyItems = currentTicket.dependencies.length
    ? currentTicket.dependencies
    : ["No explicit dependencies recorded."];
  const blockerLabel =
    currentTicket.blockerReason || "No blocker currently recorded.";
  const roleSummaryTitle =
    currentRole === "manager"
      ? "Delivery Snapshot"
      : currentRole === "analyst"
        ? "Business Context"
        : "Engineering Focus";
  const roleSummaryBody =
    currentRole === "manager"
      ? currentTicket.businessSummary
      : currentRole === "analyst"
        ? currentTicket.description
        : currentTicket.technicalSummary;

  async function handleCommentSubmit() {
    if (!authorId || !commentMessage.trim()) {
      return;
    }

    await onCreateComment(currentTicket.id, {
      authorId,
      message: commentMessage
    });

    setCommentMessage("");
  }

  async function handleBlockerCommit() {
    if (blockerDraft === currentTicket.blockerReason) {
      return;
    }

    await onUpdate(currentTicket.id, {
      status: currentTicket.status,
      assigneeId: currentTicket.assigneeId,
      blockerReason: blockerDraft
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/18 backdrop-blur-[1px]">
      <button
        type="button"
        aria-label="Close ticket detail"
        onClick={onClose}
        className="hidden flex-1 cursor-default xl:block"
      />

      <aside className="flex h-full w-full max-w-[840px] flex-col border-l border-line bg-panel shadow-[0_0_42px_rgba(17,24,39,0.09)]">
        <div className="border-b border-line bg-white px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accentMuted">
                Ticket Workspace
              </div>
              <h3 className="mt-2 truncate text-xl font-semibold text-ink">
                {currentTicket.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-line bg-panelSoft px-2 py-1">
                  {currentTicket.code}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold capitalize ${priorityStyles[currentTicket.priority]}`}
                >
                  {currentTicket.priority}
                </span>
                <span className="rounded-full border border-line bg-panelSoft px-2 py-1">
                  {assignee?.name ?? "Unassigned"}
                </span>
                <span className="rounded-full border border-line bg-panelSoft px-2 py-1">
                  {statusOptions.find((option) => option.value === currentTicket.status)?.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-panelSoft px-3.5 py-2 text-sm font-medium text-slate-600 shadow-panelSoft transition hover:bg-white"
            >
              Close
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-panelSoft p-2">
            <div className="flex flex-wrap gap-2">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-accent bg-white text-accent shadow-panelSoft"
                    : "border-transparent bg-transparent text-slate-600 hover:border-line hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "details" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-panelSoft p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                  {roleSummaryTitle}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{roleSummaryBody}</p>
              </div>

              {currentRole !== "analyst" ? (
                <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Business Summary
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {currentTicket.businessSummary}
                  </p>
                </div>
              ) : null}

              {currentRole !== "developer" ? (
                <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Description
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {currentTicket.description}
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                  Technical Summary
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {currentTicket.technicalSummary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Priority
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityStyles[currentTicket.priority]}`}
                    >
                      {currentTicket.priority}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Assignee Detail
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {assignee?.name ?? "Unassigned"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {assignee?.role ?? "No role assigned"}
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Current Status
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {statusOptions.find((option) => option.value === currentTicket.status)?.label}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Status
                  </span>
                  <select
                    value={currentTicket.status}
                    onChange={(event) =>
                      void onUpdate(currentTicket.id, {
                        status: event.target.value as TicketStatus,
                        assigneeId: currentTicket.assigneeId,
                        blockerReason: currentTicket.blockerReason
                      })
                    }
                    className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Assignee
                  </span>
                  <select
                    value={currentTicket.assigneeId}
                    onChange={(event) =>
                      void onUpdate(currentTicket.id, {
                        status: currentTicket.status,
                        assigneeId: event.target.value,
                        blockerReason: currentTicket.blockerReason
                      })
                    }
                    className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent"
                  >
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                  {currentRole === "developer" ? "Blocker Detail" : "Blocker Reason"}
                </span>
                <textarea
                  value={blockerDraft}
                  onChange={(event) => setBlockerDraft(event.target.value)}
                  onBlur={() => void handleBlockerCommit()}
                  rows={4}
                  placeholder="No blocker currently recorded."
                  className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-accent"
                />
              </label>

              {currentRole === "developer" ? (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Dependencies
                  </div>
                  <div className="mt-3 space-y-2">
                    {dependencyItems.map((dependency) => (
                      <div
                        key={dependency}
                        className="rounded-xl border border-line bg-panelSoft p-3 text-sm text-slate-600"
                      >
                        {dependency}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentRole === "manager" ? (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                    Delivery Readout
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-line bg-panelSoft p-3 text-sm text-slate-600">
                      Overall owner
                      <div className="mt-2 font-medium text-slate-800">
                        {assignee?.name ?? "Unassigned"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-panelSoft p-3 text-sm text-slate-600">
                      Current blocker
                      <div className="mt-2 font-medium text-slate-800">
                        {blockerLabel}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "comments" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                  Ticket Comments
                </div>

                <div className="mt-4 space-y-3">
                  {comments.length ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-line bg-panelSoft p-4"
                      >
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
                    <div className="rounded-xl border border-dashed border-line bg-panelSoft p-4 text-sm text-slate-500">
                      No comments yet. Add one to capture decisions or context for the next collaborator.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-5 shadow-panelSoft">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                  Add Comment
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Comment Author
                    </span>
                    <select
                      value={authorId}
                      onChange={(event) => setAuthorId(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent"
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
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-accent"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!commentMessage.trim()}
                    onClick={() => void handleCommentSubmit()}
                    className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 hover:bg-[#203f5f]"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "translate" ? (
            <TranslateTab
              currentRole={currentRole}
              managerRawInput={managerRawInput}
              selectedTicket={currentTicket}
            />
          ) : null}

          {activeTab === "handover" ? (
            <TicketHandoverSection
              currentRole={currentRole}
              projectId={projectId}
              projectSummary={projectSummary}
              ticket={currentTicket}
              teamMembers={teamMembers}
              comments={comments}
              handovers={handovers}
              onSaveHandover={onSaveHandover}
            />
          ) : null}

          {activeTab === "repo-impact" ? (
            <TicketRepoImpactSection
              currentRole={currentRole}
              ticket={currentTicket}
              repoFileSummaries={repoFileSummaries}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
