import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AlignmentReport } from "@/lib/types/domain";

export function AlignmentMatrix({
  report
}: {
  report: AlignmentReport | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Traceability</p>
          <h3 className="mt-2 text-lg font-semibold text-text">Requirement-to-code matrix</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {report?.traceability.map((row) => (
          <div key={row.criterion} className="rounded-xl border border-border/70 bg-muted-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <strong className="text-sm text-text">{row.criterion}</strong>
              <Badge variant={row.status === "covered" ? "success" : row.status === "partial" ? "warning" : "danger"}>
                {row.status}
              </Badge>
            </div>
            <p className="mb-2 text-sm text-text-muted">{row.notes}</p>
            <div className="space-y-2">
              {row.evidence.map((evidence) => (
                <div key={evidence} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                  {evidence}
                </div>
              ))}
            </div>
          </div>
        )) ?? <p className="text-sm text-text-muted">Run an alignment check to populate the traceability matrix.</p>}
      </CardContent>
    </Card>
  );
}
