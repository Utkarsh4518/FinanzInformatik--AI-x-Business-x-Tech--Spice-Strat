"use client";

import { useState } from "react";

import { Header } from "@/components/header";
import { AIInsightsPanel } from "@/components/layout/ai-insights-panel";
import { KanbanBoardPanel } from "@/components/layout/kanban-board-panel";
import { ManagerInputPanel } from "@/components/layout/manager-input-panel";
import { TicketDetailPanel } from "@/components/layout/ticket-detail-panel";
import { TicketTableToggle } from "@/components/layout/ticket-table-toggle";
import type { Ticket, TicketUpdateInput } from "@/lib/domain/models";
import type { bridgeFlowSeed } from "@/lib/seed/bridgeflow-data";

type AppShellProps = {
  data: typeof bridgeFlowSeed;
};

export function AppShell({ data }: AppShellProps) {
  const [tickets, setTickets] = useState<Ticket[]>(data.tickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    data.tickets[0]?.id ?? null
  );

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  function handleSelectTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
  }

  function handleCloseTicketDetail() {
    setSelectedTicketId(null);
  }

  function handleUpdateTicket(ticketId: string, updates: TicketUpdateInput) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      )
    );
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <Header project={data.project} />

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <aside>
            <ManagerInputPanel
              project={data.project}
              teamMembers={data.teamMembers}
            />
          </aside>

          <section className="space-y-4">
            <KanbanBoardPanel
              tickets={tickets}
              teamMembers={data.teamMembers}
              selectedTicketId={selectedTicketId}
              onSelectTicket={handleSelectTicket}
            />
            <TicketTableToggle
              tickets={tickets}
              teamMembers={data.teamMembers}
              selectedTicketId={selectedTicketId}
              onSelectTicket={handleSelectTicket}
            />
          </section>

          <aside>
            <div className="space-y-4">
              <TicketDetailPanel
                ticket={selectedTicket}
                teamMembers={data.teamMembers}
                onClose={handleCloseTicketDetail}
                onUpdate={handleUpdateTicket}
              />
              <AIInsightsPanel
                project={data.project}
                handover={data.handover}
                repoFileSummaries={data.repoFileSummaries}
                teamMembers={data.teamMembers}
                tickets={tickets}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
