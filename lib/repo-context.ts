import type { RepoFileSummary } from "@/lib/domain/models";

export const curatedRepoFileSummaries: RepoFileSummary[] = [
  {
    id: "repo-curated-1",
    path: "app/loan-calculator/page.tsx",
    area: "Main Page",
    summary:
      "Top-level loan calculator page that composes the form, results, and supporting manager-facing copy.",
    importanceScore: 88,
    tags: ["page", "loan-calculator", "entry", "layout"]
  },
  {
    id: "repo-curated-2",
    path: "components/loan-calculator/LoanCalculatorForm.tsx",
    area: "Form Component",
    summary:
      "Primary form surface for loan amount, rate, payment, and loan term inputs, including mode switching between calculator scenarios.",
    importanceScore: 97,
    tags: ["form", "inputs", "loan-term", "ui"]
  },
  {
    id: "repo-curated-3",
    path: "components/loan-calculator/LoanResultsCard.tsx",
    area: "Output Component",
    summary:
      "Displays calculated monthly payment, loan term, and business-friendly result explanations after a successful calculation.",
    importanceScore: 82,
    tags: ["results", "output", "display", "business-copy"]
  },
  {
    id: "repo-curated-4",
    path: "lib/loan-calculator/calculate-loan-term.ts",
    area: "Calculation Utilities",
    summary:
      "Core loan-term calculation logic used when deriving repayment duration from principal, interest rate, and payment inputs.",
    importanceScore: 99,
    tags: ["calculation", "loan-term", "math", "core-logic"]
  },
  {
    id: "repo-curated-5",
    path: "lib/loan-calculator/validation.ts",
    area: "Validation Logic",
    summary:
      "Validates calculator inputs, unsupported combinations, edge thresholds, and friendly validation messages for invalid states.",
    importanceScore: 93,
    tags: ["validation", "errors", "rules", "thresholds"]
  },
  {
    id: "repo-curated-6",
    path: "lib/loan-calculator/types.ts",
    area: "Shared Types",
    summary:
      "Shared request, response, and calculator mode types used by the form, calculation helpers, and result rendering.",
    importanceScore: 77,
    tags: ["types", "contracts", "shared", "interfaces"]
  },
  {
    id: "repo-curated-7",
    path: "hooks/use-loan-calculator.ts",
    area: "State Hook",
    summary:
      "Coordinates calculator form state, derived values, submission flow, and result state transitions for the loan calculator experience.",
    importanceScore: 84,
    tags: ["hook", "state", "submission", "workflow"]
  },
  {
    id: "repo-curated-8",
    path: "lib/loan-calculator/formatters.ts",
    area: "Formatting",
    summary:
      "Formats currency, percentage, month counts, and user-facing output strings for calculator results and validation feedback.",
    importanceScore: 64,
    tags: ["formatting", "currency", "output", "presentation"]
  }
];
