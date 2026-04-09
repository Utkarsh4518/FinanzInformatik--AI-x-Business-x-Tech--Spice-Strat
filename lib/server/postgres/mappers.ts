import type {
  Handover,
  JiraSyncItem,
  JiraSyncRun,
  Project,
  TeamMember,
  Ticket,
  TicketComment,
  TicketSourceType
} from "@/lib/domain/models";

type JsonValue = unknown;

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  objective: string;
  manager_brief: string;
  business_summary: string;
  technical_summary: string;
  manager_summary: string;
  languages: JsonValue;
  primary_view: Project["primaryView"];
  secondary_view: Project["secondaryView"];
};

type TeamMemberRow = {
  id: string;
  name: string;
  role: TeamMember["role"];
  availability_status: TeamMember["availabilityStatus"];
  capacity_percent: number;
  focus: string;
  languages: JsonValue;
};

type TicketRow = {
  id: string;
  project_id: string;
  code: string;
  title: string;
  description: string;
  summary: string;
  business_summary: string;
  technical_summary: string;
  status: Ticket["status"];
  priority: Ticket["priority"];
  type: Ticket["type"];
  assignee_id: string;
  dependencies: JsonValue;
  blocker_reason: string;
  source_type: TicketSourceType;
  external_key: string | null;
  external_url: string | null;
  last_synced_at: string | null;
};

type TicketCommentRow = {
  id: string;
  ticket_id: string;
  author_id: string;
  message: string;
  created_at: string;
};

type HandoverRow = {
  id: string;
  project_id: string;
  unavailable_member_id: string;
  fallback_owner_id: string;
  summary: string;
  open_ticket_ids: JsonValue;
  blockers: JsonValue;
};

type JiraSyncRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  project_key: string | null;
  fetched_count: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  status: JiraSyncRun["status"];
  error_message: string | null;
};

type JiraSyncItemRow = {
  id: string;
  sync_run_id: string;
  external_key: string;
  action_taken: JiraSyncItem["actionTaken"];
  mapped_ticket_id: string | null;
  message: string | null;
};

function toStringArray(value: JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function toJson(value: string[]) {
  return JSON.stringify(value);
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    objective: row.objective,
    managerBrief: row.manager_brief,
    businessSummary: row.business_summary,
    technicalSummary: row.technical_summary,
    managerSummary: row.manager_summary,
    languages: toStringArray(row.languages),
    primaryView: row.primary_view,
    secondaryView: row.secondary_view
  };
}

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    availabilityStatus: row.availability_status,
    capacityPercent: Number(row.capacity_percent),
    focus: row.focus,
    languages: toStringArray(row.languages)
  };
}

export function mapTicketRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    title: row.title,
    description: row.description,
    summary: row.summary,
    businessSummary: row.business_summary,
    technicalSummary: row.technical_summary,
    status: row.status,
    priority: row.priority,
    type: row.type,
    assigneeId: row.assignee_id,
    dependencies: toStringArray(row.dependencies),
    blockerReason: row.blocker_reason,
    sourceType: row.source_type,
    externalKey: row.external_key,
    externalUrl: row.external_url,
    lastSyncedAt: row.last_synced_at
  };
}

export function mapTicketCommentRow(row: TicketCommentRow): TicketComment {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    message: row.message,
    createdAt: row.created_at
  };
}

export function mapHandoverRow(row: HandoverRow): Handover {
  return {
    id: row.id,
    projectId: row.project_id,
    unavailableMemberId: row.unavailable_member_id,
    fallbackOwnerId: row.fallback_owner_id,
    summary: row.summary,
    openTicketIds: toStringArray(row.open_ticket_ids),
    blockers: toStringArray(row.blockers)
  };
}

export function mapJiraSyncRunRow(row: JiraSyncRunRow): JiraSyncRun {
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    projectKey: row.project_key,
    fetchedCount: Number(row.fetched_count),
    importedCount: Number(row.imported_count),
    updatedCount: Number(row.updated_count),
    skippedCount: Number(row.skipped_count),
    status: row.status,
    errorMessage: row.error_message
  };
}

export function mapJiraSyncItemRow(row: JiraSyncItemRow): JiraSyncItem {
  return {
    id: row.id,
    syncRunId: row.sync_run_id,
    externalKey: row.external_key,
    actionTaken: row.action_taken,
    mappedTicketId: row.mapped_ticket_id,
    message: row.message
  };
}
