import { Header } from "@/components/header";
import { AIInsightsPanel } from "@/components/layout/ai-insights-panel";
import { KanbanBoardPanel } from "@/components/layout/kanban-board-panel";
import { ManagerInputPanel } from "@/components/layout/manager-input-panel";
import { TicketTableToggle } from "@/components/layout/ticket-table-toggle";
import type { bridgeFlowSeed } from "@/lib/seed/bridgeflow-data";

type AppShellProps = {
  data: typeof bridgeFlowSeed;
};

export function AppShell({ data }: AppShellProps) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <Header project={data.project} />

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside>
            <ManagerInputPanel
              project={data.project}
              teamMembers={data.teamMembers}
            />
          </aside>

          <section className="space-y-4">
            <KanbanBoardPanel tickets={data.tickets} teamMembers={data.teamMembers} />
            <TicketTableToggle tickets={data.tickets} teamMembers={data.teamMembers} />
          </section>

          <aside>
            <AIInsightsPanel
              project={data.project}
              handover={data.handover}
              repoFileSummaries={data.repoFileSummaries}
              teamMembers={data.teamMembers}
              tickets={data.tickets}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
