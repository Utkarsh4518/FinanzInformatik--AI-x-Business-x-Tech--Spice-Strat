import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CodebaseAnswer } from "@/lib/types/domain";

export function BusinessExplanationPanel({
  answer
}: {
  answer: CodebaseAnswer | null;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <p className="section-title">AI Explanation</p>
          <h3 className="mt-2 text-lg font-semibold text-text">Business and developer context</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {answer ? (
          <>
            <div className="rounded-xl border border-border/70 bg-muted-surface p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Business mode</p>
              <p className="text-sm text-text">{answer.businessExplanation}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Developer mode</p>
              <p className="text-sm text-text">{answer.developerExplanation}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Related files</p>
              <div className="flex flex-wrap gap-2">
                {answer.relatedFiles.map((file) => (
                  <Badge key={file} variant="primary">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Risk notes</p>
              <div className="space-y-2">
                {answer.riskNotes.map((risk) => (
                  <div key={risk} className="rounded-xl border border-border/70 bg-muted-surface p-3 text-sm text-text">
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted">Ask the codebase a question to load file explanations and risk notes.</p>
        )}
      </CardContent>
    </Card>
  );
}
