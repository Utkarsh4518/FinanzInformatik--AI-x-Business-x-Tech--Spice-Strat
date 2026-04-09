import { AppShell } from "@/components/app-shell";
import { bridgeFlowSeed } from "@/lib/seed/bridgeflow-data";

export default function HomePage() {
  return <AppShell data={bridgeFlowSeed} />;
}
