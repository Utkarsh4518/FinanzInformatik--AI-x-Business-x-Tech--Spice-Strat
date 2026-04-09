import { jsPDF } from "jspdf";
import type { DiffExplanation, SharedSpec } from "@/lib/types/domain";

export function exportSpecAsMarkdown(spec: SharedSpec) {
  return `# ${spec.featureName}

## Business Intent
${spec.businessIntent}

## User Story
${spec.userStory}

## Technical Tasks
${spec.technicalTasks.map((task) => `- ${task.title}: ${task.description}`).join("\n")}

## Definition of Done
${spec.definitionOfDone.map((item) => `- ${item}`).join("\n")}
`;
}

export function exportSpecAsGitHubIssue(spec: SharedSpec) {
  return `## Summary
${spec.businessIntent}

## Acceptance Context
- User story: ${spec.userStory}
- Inputs: ${spec.inputs.join(", ")}
- Outputs: ${spec.outputs.join(", ")}

## Technical Tasks
${spec.technicalTasks.map((task) => `- [ ] ${task.title}`).join("\n")}
`;
}

export function exportDeveloperChecklist(spec: SharedSpec) {
  return spec.technicalTasks.map((task) => `- [ ] ${task.title}`).join("\n");
}

export function exportSpecAsPdf(spec: SharedSpec) {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text(spec.featureName, 14, 20);
  pdf.setFontSize(11);
  pdf.text(`Business intent: ${spec.businessIntent}`, 14, 32, { maxWidth: 180 });
  pdf.text(`Definition of done: ${spec.definitionOfDone.join(" | ")}`, 14, 50, { maxWidth: 180 });
  return pdf.output("blob");
}

export function formatReleaseNote(explanation: DiffExplanation) {
  return explanation.releaseNote;
}
