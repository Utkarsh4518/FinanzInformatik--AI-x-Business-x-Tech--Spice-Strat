import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatCard({
  label,
  value,
  hint,
  status = "neutral"
}: {
  label: string;
  value: string | number;
  hint: string;
  status?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">{label}</p>
          <Badge variant={status}>{status}</Badge>
        </div>
        <div className="flex items-end justify-between gap-3">
          <strong className="text-3xl font-semibold text-text">{value}</strong>
          <ArrowUpRight className="size-5 text-primary" />
        </div>
        <p className="text-sm text-text-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}
