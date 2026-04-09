"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/header";
import { AIInsightsPanel } from "@/components/layout/ai-insights-panel";
import { KanbanBoardPanel } from "@/components/layout/kanban-board-panel";
import { ManagerInputPanel } from "@/components/layout/manager-input-panel";
import { TicketDetailPanel } from "@/components/layout/ticket-detail-panel";
import { TicketTableToggle } from "@/components/layout/ticket-table-toggle";
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
  const [organizeResult, setOrganizeResult] = useState<OrganizeProjectResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadWorkspace() {
      try {
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

        if (!isActive) {
          return;
        }

        setProject(projects[0] ?? null);
        setManagerRawInput(projects[0]?.managerBrief ?? "");
        setTeamMembers(nextTeamMembers);
        setTickets(nextTickets);
        setTicketComments(nextComments);
        setHandovers(nextHandovers);
        setRepoFileSummaries(nextRepoSummaries);
        setSelectedTicketId(nextTickets[0]?.id ?? null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Failed to load workspace data."
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      isActive = false;
    };
  }, []);

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
        error instanceof Error ? error.message : "Ticket update failed."
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
        error instanceof Error ? error.message : "Comment creation failed."
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
        error instanceof Error ? error.message : "Handover save failed."
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
        throw new Error("Mock organize flow failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<OrganizeProjectResponse>;
      const refreshedTickets = await fetchList<Ticket>("/api/tickets");

      setOrganizeResult(payload.data);
      setTickets(refreshedTickets);
      setSelectedTicketId(refreshedTickets[0]?.id ?? null);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Mock organize flow failed."
      );
    } finally {
      setIsOrganizing(false);
    }
  }

  function handleSelectTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
  }

  function handleCloseTicketDetail() {
    setSelectedTicketId(null);
  }

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  if (isLoading && !project) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center rounded-xl2 border border-line bg-panel p-10 shadow-panel">
          <p className="text-sm text-slate-500">Loading BridgeFlow workspace...</p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
        <div className="mx-auto max-w-[1600px] rounded-xl2 border border-line bg-panel p-10 shadow-panel">
          <p className="text-sm text-rose-600">
            {loadError ?? "Project data is not available."}
          </p>
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
        />

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <aside>
            <ManagerInputPanel
              project={project}
              teamMembers={teamMembers}
              isOrganizing={isOrganizing}
              onOrganizeProject={handleOrganizeProject}
              onRawInputChange={setManagerRawInput}
            />
          </aside>

          <section className="space-y-4">
            {loadError ? (
              <div className="rounded-xl2 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {loadError}
              </div>
            ) : null}

            <KanbanBoardPanel
              tickets={tickets}
              teamMembers={teamMembers}
              selectedTicketId={selectedTicketId}
              onSelectTicket={handleSelectTicket}
            />
            <TicketTableToggle
              tickets={tickets}
              teamMembers={teamMembers}
              selectedTicketId={selectedTicketId}
              onSelectTicket={handleSelectTicket}
            />
          </section>

          <aside>
            <div className="space-y-4">
              <TicketDetailPanel
                ticket={selectedTicket}
                currentRole={currentRole}
                projectId={project.id}
                projectSummary={organizeResult?.projectSummary ?? project.managerSummary}
                teamMembers={teamMembers}
                comments={ticketComments.filter(
                  (comment) => comment.ticketId === selectedTicketId
                )}
                handovers={handovers}
                repoFileSummaries={repoFileSummaries}
                onClose={handleCloseTicketDetail}
                onUpdate={handleUpdateTicket}
                onCreateComment={handleCreateComment}
                onSaveHandover={handleCreateHandover}
              />
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
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
