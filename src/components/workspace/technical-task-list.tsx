import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TechnicalTask } from "@/lib/types/domain";

export function TechnicalTaskList({
  tasks
}: {
  tasks: TechnicalTask[];
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Developer Checklist</p>
          <h3 className="mt-2 text-lg font-semibold text-text">Technical tasks</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-border/70 bg-muted-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong className="text-sm text-text">{task.title}</strong>
              <Badge variant={task.owner === "backend" ? "warning" : task.owner === "qa" ? "success" : "primary"}>
                {task.owner}
              </Badge>
            </div>
            <p className="mb-3 text-sm text-text-muted">{task.description}</p>
            <p className="text-xs uppercase tracking-wide text-text-muted">Files</p>
            <p className="mt-1 text-sm text-text">{task.files.join(", ")}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
