import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DiffExplanation } from "@/lib/types/domain";

export function DiffExplainerCard({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-text">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function buildDiffCards(explanation: DiffExplanation | null) {
  if (!explanation) {
    return [];
  }

  return [
    { title: "Executive Summary", items: [explanation.executiveSummary] },
    { title: "What changed for users", items: explanation.userImpact },
    { title: "What changed technically", items: explanation.technicalChanges },
    { title: "Business value delivered", items: explanation.businessValue },
    { title: "Side effects / risk", items: explanation.sideEffects },
    { title: "Non-implemented items", items: explanation.nonImplementedItems },
    { title: "Suggested demo script", items: explanation.demoScript }
  ];
}
