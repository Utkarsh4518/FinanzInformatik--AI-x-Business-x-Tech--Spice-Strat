import { SpecBridgeWorkspace } from "@/components/specbridge-workspace";

export default async function SpecBridgePage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string }>;
}) {
  const params = await searchParams;
  return <SpecBridgeWorkspace initialIssue={params.issue ?? null} />;
}
