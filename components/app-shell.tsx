"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/header";
import { AIInsightsPanel } from "@/components/layout/ai-insights-panel";
import { CalculatorScenarioPanel } from "@/components/layout/calculator-scenario-panel";
import { KanbanBoardPanel } from "@/components/layout/kanban-board-panel";
import { ManagerInputPanel } from "@/components/layout/manager-input-panel";
import { ProjectBriefPanel } from "@/components/layout/project-brief-panel";
import { TicketDetailPanel } from "@/components/layout/ticket-detail-panel";
import { TicketTableToggle } from "@/components/layout/ticket-table-toggle";
import {
  WorkspaceTabs,
  type WorkspaceTab
} from "@/components/layout/workspace-tabs";
import { ProgressSummarySection } from "@/components/layout/ai-insights/progress-summary-section";
import { TicketHandoverSection } from "@/components/layout/ticket-detail/ticket-handover-section";
import { TicketRepoImpactSection } from "@/components/layout/ticket-detail/ticket-repo-impact-section";
import { ShellPanel } from "@/components/ui/shell-panel";
import type {
  ApiItemResponse,
  ApiListResponse,
  CreateHandoverRequest,
  CreateTicketCommentRequest,
  OrganizeProjectRequest,
  OrganizeProjectResponse
} from "@/lib/domain/api";
import type {
  AppRole,
  Handover,
  Project,
  RepoFileSummary,
  TeamMember,
  Ticket,
  TicketComment,
  TicketUpdateInput
} from "@/lib/domain/models";

async function fetchList<T>(url: string): Promise<T[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  const payload = (await response.json()) as ApiListResponse<T>;
  return payload.data;
}

export function AppShell() {
  const [project, setProject] = useState<Project | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>("manager");
  const [managerRawInput, setManagerRawInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [repoFileSummaries, setRepoFileSummaries] = useState<RepoFileSummary[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkspaceTab>("overview");
  const [taskView, setTaskView] = useState<"board" | "table">("board");
  const [isIntakeExpanded, setIsIntakeExpanded] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<OrganizeProjectResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadWorkspace(options?: { preserveSelection?: boolean }) {
    setIsLoading(true);
    setLoadError(null);

    const [
      projects,
      nextTeamMembers,
      nextTickets,
      nextComments,
      nextHandovers,
      nextRepoSummaries
    ] = await Promise.all([
      fetchList<Project>("/api/projects"),
      fetchList<TeamMember>("/api/team-members"),
      fetchList<Ticket>("/api/tickets"),
      fetchList<TicketComment>("/api/ticket-comments"),
      fetchList<Handover>("/api/handovers"),
      fetchList<RepoFileSummary>("/api/repo-file-summaries")
    ]);

    setProject(projects[0] ?? null);
    setManagerRawInput(projects[0]?.managerBrief ?? "");
    setTeamMembers(nextTeamMembers);
    setTickets(nextTickets);
    setTicketComments(nextComments);
    setHandovers(nextHandovers);
    setRepoFileSummaries(nextRepoSummaries);
    setSelectedTicketId((currentSelectedId) => {
      if (
        options?.preserveSelection &&
        currentSelectedId &&
        nextTickets.some((ticket) => ticket.id === currentSelectedId)
      ) {
        return currentSelectedId;
      }

      return nextTickets[0]?.id ?? null;
    });
    setDetailTicketId((currentDetailId) => {
      if (
        options?.preserveSelection &&
        currentDetailId &&
        nextTickets.some((ticket) => ticket.id === currentDetailId)
      ) {
        return currentDetailId;
      }

      return null;
    });
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialWorkspace() {
      try {
        await loadWorkspace();
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load workspace data."
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialWorkspace();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const roleDefaultTab: Record<AppRole, WorkspaceTab> = {
      manager: "overview",
      analyst: "insights",
      developer: "tasks"
    };

    setActiveWorkspaceTab(roleDefaultTab[currentRole]);
  }, [currentRole]);

  async function handleUpdateTicket(ticketId: string, updates: TicketUpdateInput) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error("Ticket update failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<Ticket>;

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId ? payload.data : ticket
        )
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Ticket update failed. Existing data remains available."
      );
    }
  }

  async function handleCreateComment(
    ticketId: string,
    input: CreateTicketCommentRequest
  ) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error("Comment creation failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<TicketComment>;
      setTicketComments((currentComments) => [...currentComments, payload.data]);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Comment creation failed. The ticket detail remains available."
      );
    }
  }

  async function handleCreateHandover(input: CreateHandoverRequest) {
    try {
      const response = await fetch("/api/handovers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error("Handover save failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<Handover>;
      setHandovers((currentHandovers) => [payload.data, ...currentHandovers]);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Handover save failed. Existing records remain visible."
      );
    }
  }

  async function handleOrganizeProject(input: OrganizeProjectRequest) {
    try {
      setIsOrganizing(true);

      const response = await fetch("/api/ai/organize-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error("Organize request failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<OrganizeProjectResponse>;
      const refreshedTickets = await fetchList<Ticket>("/api/tickets");

      setOrganizeResult(payload.data);
      setTickets(refreshedTickets);
      setSelectedTicketId(refreshedTickets[0]?.id ?? null);
      setDetailTicketId(refreshedTickets[0]?.id ?? null);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Organize request failed. Current board state remains available."
      );
    } finally {
      setIsOrganizing(false);
    }
  }

  async function handleResetDemo() {
    try {
      setIsResetting(true);
      setLoadError(null);
      setOrganizeResult(null);

      const response = await fetch("/api/demo/reset", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Demo reset failed.");
      }

      await loadWorkspace();
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Demo reset failed. Current scenario remains available."
      );
    } finally {
      setIsResetting(false);
      setIsLoading(false);
    }
  }

  function handleSelectTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
    setDetailTicketId(ticketId);
    setActiveWorkspaceTab("tasks");
  }

  function handleCloseTicketDetail() {
    setDetailTicketId(null);
  }

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const detailTicket =
    tickets.find((ticket) => ticket.id === detailTicketId) ?? null;
  const selectedTicketComments = ticketComments.filter(
    (comment) => comment.ticketId === selectedTicketId
  );
  const detailTicketComments = ticketComments.filter(
    (comment) => comment.ticketId === detailTicketId
  );

  if (isLoading && !project) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center rounded-xl2 border border-line bg-panel p-10 shadow-panel">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-slate-700">
              Loading BridgeFlow workspace
            </p>
            <p className="text-sm text-slate-500">
              Preparing the seeded demo scenario, tickets, and insights.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
        <div className="mx-auto max-w-[1600px] rounded-xl2 border border-line bg-panel p-10 shadow-panel">
          <div className="space-y-4">
            <p className="text-sm text-rose-600">
              {loadError ?? "Project data is not available."}
            </p>
            <button
              type="button"
              onClick={() => void handleResetDemo()}
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {isResetting ? "Resetting demo..." : "Reset Demo Scenario"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <Header
          project={project}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-4 xl:self-start">
            {isIntakeExpanded ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl2 border border-line bg-panel px-4 py-3 shadow-panelSoft">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                      Intake Workspace
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Update the brief, team availability, and organizer inputs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsIntakeExpanded(false)}
                    className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600"
                  >
                    Collapse
                  </button>
                </div>

                <ManagerInputPanel
                  project={project}
                  teamMembers={teamMembers}
                  isOrganizing={isOrganizing}
                  onOrganizeProject={handleOrganizeProject}
                  onRawInputChange={setManagerRawInput}
                />
              </div>
            ) : (
              <ProjectBriefPanel
                project={project}
                teamMembers={teamMembers}
                tickets={tickets}
                onEditIntake={() => setIsIntakeExpanded(true)}
              />
            )}
          </aside>

          <section className="space-y-4">
            {loadError ? (
              <div className="rounded-xl2 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {loadError}
              </div>
            ) : null}

            <WorkspaceTabs
              activeTab={activeWorkspaceTab}
              onChange={setActiveWorkspaceTab}
            />

            {activeWorkspaceTab === "overview" ? (
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <ShellPanel
                    title="Program Overview"
                    description="One-page view of the current collaboration state for the seeded loan calculator scenario."
                  >
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-line bg-panelSoft p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                          Project Objective
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {project.objective}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line bg-panelSoft p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                          Current Focus
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {organizeResult?.projectSummary ?? project.managerSummary}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line bg-panelSoft p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                          Role Guidance
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {currentRole === "manager"
                            ? "Focus on progress, blockers, and continuity risk."
                            : currentRole === "analyst"
                              ? "Focus on business framing, scope, and open questions."
                              : "Focus on delivery detail, ownership, and likely implementation impact."}
                        </p>
                      </div>
                    </div>
                  </ShellPanel>

                  <ProgressSummarySection
                    currentRole={currentRole}
                    project={project}
                    tickets={tickets}
                    teamMembers={teamMembers}
                    comments={ticketComments}
                  />
                </div>

                <ShellPanel
                  title="Selected Ticket"
                  description="The current task context stays available while the workspace tab changes."
                >
                  {selectedTicket ? (
                    <div className="rounded-2xl border border-line bg-panelSoft p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {selectedTicket.title}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                            {selectedTicket.code}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectTicket(selectedTicket.id)}
                          className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600"
                        >
                          Open Detail
                        </button>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {selectedTicket.businessSummary}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-panelSoft p-5 text-sm text-slate-500">
                      Select a ticket in the Tasks tab to open its full drawer and role-aware actions.
                    </div>
                  )}
                </ShellPanel>
              </div>
            ) : null}

            {activeWorkspaceTab === "tasks" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-panel px-4 py-3 shadow-panelSoft">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
                      Task Workspace
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep one primary task view in focus and open the drawer for deeper work.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-line bg-panelSoft p-1">
                    <button
                      type="button"
                      onClick={() => setTaskView("board")}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        taskView === "board"
                          ? "bg-accent text-white"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      Board
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskView("table")}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        taskView === "table"
                          ? "bg-accent text-white"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {taskView === "board" ? (
                  <KanbanBoardPanel
                    tickets={tickets}
                    teamMembers={teamMembers}
                    selectedTicketId={selectedTicketId}
                    onSelectTicket={handleSelectTicket}
                  />
                ) : (
                  <TicketTableToggle
                    tickets={tickets}
                    teamMembers={teamMembers}
                    selectedTicketId={selectedTicketId}
                    onSelectTicket={handleSelectTicket}
                  />
                )}
              </div>
            ) : null}

            {activeWorkspaceTab === "insights" ? (
              <AIInsightsPanel
                currentRole={currentRole}
                project={project}
                handovers={handovers}
                repoFileSummaries={repoFileSummaries}
                teamMembers={teamMembers}
                tickets={tickets}
                comments={ticketComments}
                selectedTicket={selectedTicket}
                managerRawInput={managerRawInput}
                organizeResult={organizeResult}
                onCreateHandover={handleCreateHandover}
              />
            ) : null}

            {activeWorkspaceTab === "handover" ? (
              selectedTicket ? (
                <TicketHandoverSection
                  currentRole={currentRole}
                  projectId={project.id}
                  projectSummary={organizeResult?.projectSummary ?? project.managerSummary}
                  ticket={selectedTicket}
                  teamMembers={teamMembers}
                  comments={selectedTicketComments}
                  handovers={handovers}
                  onSaveHandover={handleCreateHandover}
                />
              ) : (
                <ShellPanel
                  title="Handover"
                  description="Select a ticket to generate or review a focused handover."
                >
                  <div className="rounded-2xl border border-dashed border-line bg-panelSoft p-5 text-sm text-slate-500">
                    Pick a ticket in the Tasks tab, then use this workspace to generate a role-aware handover and save it to the existing record flow.
                  </div>
                </ShellPanel>
              )
            ) : null}

            {activeWorkspaceTab === "repo-impact" ? (
              selectedTicket ? (
                <TicketRepoImpactSection
                  currentRole={currentRole}
                  ticket={selectedTicket}
                  repoFileSummaries={repoFileSummaries}
                />
              ) : (
                <ShellPanel
                  title="Repo Impact"
                  description="Run code-surface impact analysis from the selected ticket."
                >
                  <div className="rounded-2xl border border-dashed border-line bg-panelSoft p-5 text-sm text-slate-500">
                    Select a ticket in the Tasks tab to estimate which curated loan-calculator files are most likely affected.
                  </div>
                </ShellPanel>
              )
            ) : null}

            {activeWorkspaceTab === "calculator-scenario" ? (
              <CalculatorScenarioPanel project={project} tickets={tickets} />
            ) : null}
          </section>
        </div>

        <TicketDetailPanel
          ticket={detailTicket}
          currentRole={currentRole}
          projectId={project.id}
          projectSummary={organizeResult?.projectSummary ?? project.managerSummary}
          managerRawInput={managerRawInput}
          teamMembers={teamMembers}
          comments={detailTicketComments}
          handovers={handovers}
          repoFileSummaries={repoFileSummaries}
          onClose={handleCloseTicketDetail}
          onUpdate={handleUpdateTicket}
          onCreateComment={handleCreateComment}
          onSaveHandover={handleCreateHandover}
        />
      </div>
    </main>
  );
}
