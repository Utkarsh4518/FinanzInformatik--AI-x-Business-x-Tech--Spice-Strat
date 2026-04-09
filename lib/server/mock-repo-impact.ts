import type {
  RepoImpactRelevantFile,
  RepoImpactRequest,
  RepoImpactResponse
} from "@/lib/domain/api";

function buildSourceText(input: RepoImpactRequest) {
  if (input.selectedTicket) {
    return `${input.selectedTicket.title} ${input.selectedTicket.description} ${input.selectedTicket.businessSummary} ${input.selectedTicket.technicalSummary} ${input.selectedTicket.blockerReason}`.toLowerCase();
  }

  return (input.requirement ?? "").toLowerCase();
}

function keywordScore(inputText: string, file: RepoImpactRequest["repoFileSummaries"][number]) {
  const candidateText = `${file.path} ${file.area} ${file.summary} ${file.excerpt ?? ""} ${(file.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = Array.from(
    new Set(
      inputText
        .split(/[^a-z0-9]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3)
    )
  );

  let score = file.importanceScore;

  for (const keyword of keywords) {
    if (candidateText.includes(keyword)) {
      score += 24;
    }
  }

  if (
    (inputText.includes("multilingual") || inputText.includes("german")) &&
    (file.tags ?? []).some((tag) => ["multilingual", "translation", "business"].includes(tag))
  ) {
    score += 30;
  }

  if (
    (inputText.includes("blocker") || inputText.includes("handover") || inputText.includes("owner")) &&
    (file.tags ?? []).some((tag) => ["handover", "ownership", "blockers"].includes(tag))
  ) {
    score += 35;
  }

  if (
    (inputText.includes("status") || inputText.includes("board") || inputText.includes("workflow")) &&
    (file.tags ?? []).some((tag) => ["kanban", "board", "workflow", "status"].includes(tag))
  ) {
    score += 28;
  }

  if (
    (inputText.includes("summary") || inputText.includes("manager")) &&
    (file.tags ?? []).some((tag) => ["summary", "manager", "insights"].includes(tag))
  ) {
    score += 26;
  }

  return score;
}

function buildReason(
  input: RepoImpactRequest,
  file: RepoImpactRequest["repoFileSummaries"][number]
) {
  const role = input.currentRoleView ?? "developer";

  if (role === "manager") {
    return `${file.area} is part of the likely implementation surface because this work changes how the selected ticket is captured, shown, or summarized.`;
  }

  if (role === "analyst") {
    return `${file.area} is a likely affected product area because it carries the business-facing behavior or explanation for this ticket.`;
  }

  return `${file.path} is a strong technical match based on its area, tags, and current summary: ${file.summary}`;
}

export function buildMockRepoImpactResponse(
  input: RepoImpactRequest
): RepoImpactResponse {
  const inputText = buildSourceText(input);
  const rankedFiles = [...input.repoFileSummaries]
    .map((file) => ({
      file,
      score: keywordScore(inputText, file)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const relevantFiles: RepoImpactRelevantFile[] = rankedFiles.map(({ file, score }) => ({
    path: file.path,
    reason: buildReason(input, file),
    confidenceScore: Math.min(0.98, Math.max(0.45, score / 140))
  }));

  const impactedAreas = rankedFiles.map(({ file }) => file.area).join(", ");
  const overallImpactSummary =
    input.currentRoleView === "manager"
      ? `This ticket likely affects ${impactedAreas}, so the implementation surface is moderate and will span both workflow visibility and manager-facing coordination.`
      : input.currentRoleView === "analyst"
        ? `This ticket most likely changes the ${impactedAreas} areas, which means the visible product behavior and explanations around the work item will need review.`
        : `This ticket most likely impacts ${impactedAreas}, with the strongest signals in the selected file paths and shared coordination surfaces.`;

  return {
    relevantFiles,
    overallImpactSummary
  };
}
