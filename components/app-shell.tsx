import { Header } from "@/components/header";
import { AIInsightsPanel } from "@/components/layout/ai-insights-panel";
import { KanbanBoardPanel } from "@/components/layout/kanban-board-panel";
import { ManagerInputPanel } from "@/components/layout/manager-input-panel";
import { TicketTableToggle } from "@/components/layout/ticket-table-toggle";

export function AppShell() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-4 text-ink md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <Header />

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside>
            <ManagerInputPanel />
          </aside>

          <section className="space-y-4">
            <KanbanBoardPanel />
            <TicketTableToggle />
          </section>

          <aside>
            <AIInsightsPanel />
          </aside>
        </div>
      </div>
    </main>
  );
}
