import { pendingLabel, riskTone } from "../lib/formatters";

function Metric({ label, value, tone = "neutral" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function MetricStrip({ intelligence, thread }) {
  const reworkRisk = intelligence.requirementStabilityScore >= 80 ? "Low" : intelligence.requirementStabilityScore >= 65 ? "Medium" : "High";

  return (
    <section className="metric-strip">
      <Metric label="Stability" value={`${intelligence.requirementStabilityScore}/100`} tone={riskTone(intelligence.requirementStabilityScore)} />
      <Metric label="Open Questions" value={intelligence.openQuestionsCount} tone={intelligence.openQuestionsCount ? "warn" : "good"} />
      <Metric label="Ambiguity" value={intelligence.ambiguityCount} tone={intelligence.ambiguityCount > 2 ? "warn" : "neutral"} />
      <Metric label="Rework Risk" value={reworkRisk} tone={reworkRisk === "High" ? "risk" : reworkRisk === "Medium" ? "warn" : "good"} />
      <Metric label="Pending" value={pendingLabel(thread.pendingSide)} tone={thread.pendingSide === "none" ? "good" : "warn"} />
    </section>
  );
}
