export type TicketStatus = "backlog" | "in_progress" | "review" | "done";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketType = "feature" | "task" | "bug" | "research";

export type AvailabilityStatus = "available" | "busy" | "unavailable";

export type TeamRole =
  | "manager"
  | "business_analyst"
  | "frontend_engineer"
  | "backend_engineer"
  | "qa_engineer";

export type TargetOutputLanguage = "English" | "German" | "Bilingual";

export type Project = {
  id: string;
  name: string;
  code: string;
  objective: string;
  managerBrief: string;
  businessSummary: string;
  technicalSummary: string;
  managerSummary: string;
  languages: string[];
  primaryView: "kanban";
  secondaryView: "table";
};

export type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  availabilityStatus: AvailabilityStatus;
  capacityPercent: number;
  focus: string;
  languages: string[];
};

export type Ticket = {
  id: string;
  projectId: string;
  code: string;
  title: string;
  summary: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  assigneeId: string;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type Handover = {
  id: string;
  projectId: string;
  unavailableMemberId: string;
  fallbackOwnerId: string;
  summary: string;
  openTicketIds: string[];
  blockers: string[];
};

export type RepoFileSummary = {
  id: string;
  path: string;
  area: string;
  summary: string;
};

export type TeamAvailabilityInput = {
  memberId: string;
  name: string;
  role: TeamRole;
  availabilityStatus: AvailabilityStatus;
  capacityPercent: number;
};

export type ManagerIntakePayload = {
  projectName: string;
  rawProjectInput: string;
  targetOutputLanguage: TargetOutputLanguage;
  includeRepoContext: boolean;
  teamAvailability: TeamAvailabilityInput[];
};
