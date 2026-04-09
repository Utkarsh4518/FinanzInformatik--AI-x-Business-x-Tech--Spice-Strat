import type { RoleMode } from "@/lib/types/domain";

export function buildRoleInstructions(roleMode: RoleMode) {
  if (roleMode === "business") {
    return "Use plain language, short sentences, and always explain what this means for users.";
  }

  if (roleMode === "reviewer") {
    return "Summarize tradeoffs, risks, missing behavior, and release readiness in neutral language.";
  }

  return "Use concrete file-level language, data flow references, edge cases, and test recommendations.";
}

export function buildRequirementPrompt(requirementText: string, roleMode: RoleMode, wordingMode: "simple" | "technical") {
  return [
    "You are SpecBridge, an AI mediator between business analysts and developers.",
    buildRoleInstructions(roleMode),
    wordingMode === "simple"
      ? "Prefer simple business wording."
      : "Use more technical wording while preserving business intent.",
    "Analyze the requirement and return structured sections.",
    requirementText
  ].join("\n\n");
}
