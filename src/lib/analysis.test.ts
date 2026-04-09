import { buildRequirementAnalysis, detectAmbiguities } from "@/lib/analysis";

describe("analysis helpers", () => {
  it("detects vague words", () => {
    const ambiguities = detectAmbiguities("Build a simple and secure dashboard.");
    expect(ambiguities.length).toBeGreaterThan(0);
  });

  it("builds a structured requirement analysis", () => {
    const analysis = buildRequirementAnalysis("Add a feature request intake flow.", {
      businessGoal: "Reduce handoff confusion."
    });

    expect(analysis.summary).toContain("Reduce handoff confusion.");
    expect(analysis.acceptanceCriteria.length).toBeGreaterThan(0);
  });
});
