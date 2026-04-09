import type {
  Handover,
  Project,
  TeamMember,
  Ticket,
  TicketComment
} from "@/lib/domain/models";
import { curatedRepoFileSummaries } from "@/lib/repo-context";

export const bridgeFlowProject: Project = {
  id: "project-loan-calc",
  name: "BridgeFlow Loan Calculator Extension",
  code: "BF-LOAN",
  objective:
    "Organize messy multilingual project notes into delivery-ready work for adding loan term calculation to the loan calculator.",
  managerBrief:
    "Please extend the loan calculator to support loan term calculation, keep the experience clear for business users, and align English and German notes before implementation starts.",
  businessSummary:
    "The manager needs one coordinated view of scope, progress, and risks while the team extends the loan calculator with loan term calculation.",
  technicalSummary:
    "Work will likely touch input validation, calculation rules, form copy, API handling, and regression coverage for both monthly payment and loan term scenarios.",
  managerSummary:
    "The current plan is split into business clarification, frontend updates, backend rule support, QA coverage, and a handover path for one unavailable teammate.",
  languages: ["English", "German"],
  primaryView: "kanban",
  secondaryView: "table"
};

export const bridgeFlowTeamMembers: TeamMember[] = [
  {
    id: "member-ava",
    name: "Ava Chen",
    role: "manager",
    availabilityStatus: "available",
    capacityPercent: 70,
    focus: "Own demo narrative, scope decisions, and stakeholder alignment.",
    languages: ["English"]
  },
  {
    id: "member-lukas",
    name: "Lukas Weber",
    role: "business_analyst",
    availabilityStatus: "available",
    capacityPercent: 85,
    focus: "Translate mixed-language requirements into clean acceptance criteria.",
    languages: ["German", "English"]
  },
  {
    id: "member-maya",
    name: "Maya Patel",
    role: "frontend_engineer",
    availabilityStatus: "busy",
    capacityPercent: 65,
    focus: "Update calculator inputs, board views, and manager-facing status flows.",
    languages: ["English"]
  },
  {
    id: "member-noah",
    name: "Noah Garcia",
    role: "backend_engineer",
    availabilityStatus: "unavailable",
    capacityPercent: 0,
    focus: "Support calculation rules and local integration contracts when available.",
    languages: ["English", "Spanish"]
  },
  {
    id: "member-zoe",
    name: "Zoe Schmidt",
    role: "qa_engineer",
    availabilityStatus: "available",
    capacityPercent: 75,
    focus: "Cover calculator edge cases, translations, and demo reliability.",
    languages: ["German", "English"]
  }
];

export const bridgeFlowTickets: Ticket[] = [
  {
    id: "ticket-101",
    projectId: bridgeFlowProject.id,
    code: "BF-101",
    title: "Normalize multilingual manager notes",
    description:
      "Clean up the original English and German manager notes so the team works from a single consistent scope statement for the loan calculator extension.",
    summary: "Convert rough English and German intake into a shared scope baseline.",
    businessSummary:
      "Creates a stable project brief that managers and analysts can align on before execution.",
    technicalSummary:
      "Establishes terminology and scope boundaries that downstream UI, backend, and QA tickets can reference consistently.",
    status: "done",
    priority: "high",
    type: "task",
    assigneeId: "member-lukas",
    dependencies: [],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-102",
    projectId: bridgeFlowProject.id,
    code: "BF-102",
    title: "Define loan term calculation acceptance criteria",
    description:
      "Translate the manager request into explicit business rules for calculating loan term from payment, amount, and rate inputs.",
    summary: "Document business rules for calculating loan term from payment inputs.",
    businessSummary:
      "Clarifies what the manager expects the extended calculator to do and what outputs matter for review.",
    technicalSummary:
      "Specifies the input combinations, validation boundaries, and result expectations needed before implementation starts.",
    status: "review",
    priority: "critical",
    type: "feature",
    assigneeId: "member-lukas",
    dependencies: ["Normalize multilingual manager notes"],
    blockerReason: "Waiting for final confirmation on unsupported payment combinations.",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-103",
    projectId: bridgeFlowProject.id,
    code: "BF-103",
    title: "Add loan term fields to calculator UI",
    description:
      "Update the frontend calculator flow so users can request loan term output alongside the existing payment scenarios.",
    summary: "Extend the calculator form so users can request loan term output.",
    businessSummary:
      "Adds the visible product change the manager needs for the demo scenario.",
    technicalSummary:
      "Requires new input states, view logic, and consistent labeling for the extended calculator flow.",
    status: "in_progress",
    priority: "high",
    type: "feature",
    assigneeId: "member-maya",
    dependencies: ["Define loan term calculation acceptance criteria"],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-104",
    projectId: bridgeFlowProject.id,
    code: "BF-104",
    title: "Adjust validation and empty states",
    description:
      "Refine validation copy and edge-state handling so the calculator remains understandable when inputs are incomplete or invalid.",
    summary: "Handle invalid values, missing fields, and dual-language validation copy.",
    businessSummary:
      "Protects demo quality by keeping the experience clear for business stakeholders.",
    technicalSummary:
      "Touches frontend validation rules, inline messaging, and error-state coverage for both languages.",
    status: "backlog",
    priority: "medium",
    type: "task",
    assigneeId: "member-maya",
    dependencies: ["Add loan term fields to calculator UI"],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-105",
    projectId: bridgeFlowProject.id,
    code: "BF-105",
    title: "Support backend calculation contract",
    description:
      "Define how the calculator should send and receive data for loan term calculation without breaking the current flow.",
    summary: "Align payload shape and result handling for loan term calculation.",
    businessSummary:
      "Keeps the demo story credible by showing that frontend and backend work are aligned.",
    technicalSummary:
      "Needs contract agreement for request shape, field validation, and response handling for calculated term results.",
    status: "backlog",
    priority: "high",
    type: "feature",
    assigneeId: "member-noah",
    dependencies: ["Define loan term calculation acceptance criteria"],
    blockerReason: "Backend owner is unavailable and the endpoint shape is still undecided.",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-106",
    projectId: bridgeFlowProject.id,
    code: "BF-106",
    title: "Cover loan term regression paths",
    description:
      "Prepare QA coverage for the extended calculator so both happy paths and edge cases are represented in the demo.",
    summary: "Prepare QA cases for positive, negative, and boundary calculator flows.",
    businessSummary:
      "Reduces demo risk and gives the manager confidence that the change is being validated.",
    technicalSummary:
      "Includes test cases for rounding, thresholds, translations, and compatibility with current calculator behavior.",
    status: "in_progress",
    priority: "high",
    type: "task",
    assigneeId: "member-zoe",
    dependencies: [
      "Add loan term fields to calculator UI",
      "Adjust validation and empty states"
    ],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-107",
    projectId: bridgeFlowProject.id,
    code: "BF-107",
    title: "Draft manager progress summary",
    description:
      "Prepare a concise manager-facing summary that explains the current state of the work in business language.",
    summary: "Explain implementation progress in business-friendly language for demo review.",
    businessSummary:
      "Provides a leadership-friendly update on scope, status, and next decisions.",
    technicalSummary:
      "Synthesizes ticket progress into a concise summary without exposing low-level implementation noise.",
    status: "review",
    priority: "medium",
    type: "task",
    assigneeId: "member-ava",
    dependencies: ["Define loan term calculation acceptance criteria"],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  },
  {
    id: "ticket-108",
    projectId: bridgeFlowProject.id,
    code: "BF-108",
    title: "Prepare backend handover pack",
    description:
      "Capture backend status, open questions, and next steps so work can continue while one teammate is unavailable.",
    summary: "Capture open decisions and next steps while the backend owner is unavailable.",
    businessSummary:
      "Maintains continuity for the manager when a key contributor is unavailable.",
    technicalSummary:
      "Packages current contract assumptions, blockers, and next actions so another owner can step in quickly.",
    status: "done",
    priority: "medium",
    type: "research",
    assigneeId: "member-ava",
    dependencies: ["Support backend calculation contract"],
    blockerReason: "",
    sourceType: "local",
    externalKey: null,
    externalUrl: null,
    lastSyncedAt: null
  }
];

export const bridgeFlowTicketComments: TicketComment[] = [
  {
    id: "comment-201",
    ticketId: "ticket-102",
    authorId: "member-lukas",
    message:
      "German notes mention term calculation from monthly payment, so acceptance criteria now cover both direct and reverse calculation flows.",
    createdAt: "2026-04-09 10:15"
  },
  {
    id: "comment-202",
    ticketId: "ticket-103",
    authorId: "member-maya",
    message:
      "UI draft needs one more pass on labels so the new fields make sense for business demos without exposing too much technical detail.",
    createdAt: "2026-04-09 11:05"
  },
  {
    id: "comment-203",
    ticketId: "ticket-106",
    authorId: "member-zoe",
    message:
      "QA will focus on rounding, translation consistency, and edge values around minimum payment thresholds.",
    createdAt: "2026-04-09 11:42"
  }
];

export const bridgeFlowHandover: Handover = {
  id: "handover-301",
  projectId: bridgeFlowProject.id,
  unavailableMemberId: "member-noah",
  fallbackOwnerId: "member-ava",
  summary:
    "Backend rule support is partially scoped, but implementation is paused while Noah is unavailable. Ava owns demo continuity and will route urgent questions through the documented contract notes.",
  openTicketIds: ["ticket-105", "ticket-108"],
  blockers: [
    "Need confirmation on whether loan term calculation lives in the existing endpoint or a new handler.",
    "Validation edge cases for unsupported payment combinations are still open."
  ]
};

export const bridgeFlowRepoFileSummaries = curatedRepoFileSummaries;

export const bridgeFlowSeed = {
  project: bridgeFlowProject,
  teamMembers: bridgeFlowTeamMembers,
  tickets: bridgeFlowTickets,
  ticketComments: bridgeFlowTicketComments,
  handover: bridgeFlowHandover,
  repoFileSummaries: bridgeFlowRepoFileSummaries
};
