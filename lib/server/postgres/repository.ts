import { randomUUID } from "node:crypto";

import type {
  CreateHandoverRequest,
  CreateTicketCommentRequest
} from "@/lib/domain/api";
import type {
  Handover,
  Project,
  TeamMember,
  Ticket,
  TicketComment,
  TicketUpdateInput
} from "@/lib/domain/models";
import {
  ensurePostgresReady,
  seedPostgresDemoScenario
} from "@/lib/server/postgres/bootstrap";
import { queryPostgres, withPostgresClient } from "@/lib/server/postgres/client";
import {
  mapHandoverRow,
  mapProjectRow,
  mapTeamMemberRow,
  mapTicketCommentRow,
  mapTicketRow,
  toJson
} from "@/lib/server/postgres/mappers";

type CountRow = { count: string };

export async function getProjectsFromPostgres(): Promise<Project[]> {
  await ensurePostgresReady();
  const result = await queryPostgres<{
    id: string;
    name: string;
    code: string;
    objective: string;
    manager_brief: string;
    business_summary: string;
    technical_summary: string;
    manager_summary: string;
    languages: unknown;
    primary_view: Project["primaryView"];
    secondary_view: Project["secondaryView"];
  }>(`
    SELECT
      id,
      name,
      code,
      objective,
      manager_brief,
      business_summary,
      technical_summary,
      manager_summary,
      languages,
      primary_view,
      secondary_view
    FROM projects
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapProjectRow);
}

export async function getTeamMembersFromPostgres(): Promise<TeamMember[]> {
  await ensurePostgresReady();
  const result = await queryPostgres<{
    id: string;
    name: string;
    role: TeamMember["role"];
    availability_status: TeamMember["availabilityStatus"];
    capacity_percent: number;
    focus: string;
    languages: unknown;
  }>(`
    SELECT
      id,
      name,
      role,
      availability_status,
      capacity_percent,
      focus,
      languages
    FROM team_members
    ORDER BY name ASC
  `);

  return result.rows.map(mapTeamMemberRow);
}

export async function getTicketsFromPostgres(): Promise<Ticket[]> {
  await ensurePostgresReady();
  const result = await queryPostgres<{
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
    dependencies: unknown;
    blocker_reason: string;
    source_type: Ticket["sourceType"];
    external_key: string | null;
    external_url: string | null;
    last_synced_at: string | null;
  }>(`
    SELECT
      id,
      project_id,
      code,
      title,
      description,
      summary,
      business_summary,
      technical_summary,
      status,
      priority,
      type,
      assignee_id,
      dependencies,
      blocker_reason,
      source_type,
      external_key,
      external_url,
      last_synced_at
    FROM tickets
    ORDER BY code ASC
  `);

  return result.rows.map(mapTicketRow);
}

export async function getTicketCommentsFromPostgres(): Promise<TicketComment[]> {
  await ensurePostgresReady();
  const result = await queryPostgres<{
    id: string;
    ticket_id: string;
    author_id: string;
    message: string;
    created_at: string;
  }>(`
    SELECT
      id,
      ticket_id,
      author_id,
      message,
      created_at
    FROM ticket_comments
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapTicketCommentRow);
}

export async function getHandoversFromPostgres(): Promise<Handover[]> {
  await ensurePostgresReady();
  const result = await queryPostgres<{
    id: string;
    project_id: string;
    unavailable_member_id: string;
    fallback_owner_id: string;
    summary: string;
    open_ticket_ids: unknown;
    blockers: unknown;
  }>(`
    SELECT
      id,
      project_id,
      unavailable_member_id,
      fallback_owner_id,
      summary,
      open_ticket_ids,
      blockers
    FROM handovers
    ORDER BY created_at DESC, id DESC
  `);

  return result.rows.map(mapHandoverRow);
}

export async function replaceTicketsInPostgres(tickets: Ticket[]) {
  await ensurePostgresReady();

  await withPostgresClient(async (client) => {
    await client.query("BEGIN");

    try {
      const projectIds = Array.from(new Set(tickets.map((ticket) => ticket.projectId)));

      if (projectIds.length) {
        await client.query(
          "DELETE FROM tickets WHERE project_id = ANY($1::text[]) AND source_type = 'local'",
          [projectIds]
        );
      } else {
        await client.query("DELETE FROM tickets WHERE source_type = 'local'");
      }

      for (const ticket of tickets) {
        await client.query(
          `
            INSERT INTO tickets (
              id,
              project_id,
              code,
              title,
              description,
              summary,
              business_summary,
              technical_summary,
              status,
              priority,
              type,
              assignee_id,
              dependencies,
              blocker_reason,
              source_type,
              external_key,
              external_url,
              last_synced_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18
            )
          `,
          [
            ticket.id,
            ticket.projectId,
            ticket.code,
            ticket.title,
            ticket.description,
            ticket.summary,
            ticket.businessSummary,
            ticket.technicalSummary,
            ticket.status,
            ticket.priority,
            ticket.type,
            ticket.assigneeId,
            toJson(ticket.dependencies),
            ticket.blockerReason,
            ticket.sourceType,
            ticket.externalKey,
            ticket.externalUrl,
            ticket.lastSyncedAt
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  return tickets;
}

export async function upsertTicketsInPostgres(tickets: Ticket[]) {
  await ensurePostgresReady();

  await withPostgresClient(async (client) => {
    await client.query("BEGIN");

    try {
      for (const ticket of tickets) {
        await client.query(
          `
            INSERT INTO tickets (
              id,
              project_id,
              code,
              title,
              description,
              summary,
              business_summary,
              technical_summary,
              status,
              priority,
              type,
              assignee_id,
              dependencies,
              blocker_reason,
              source_type,
              external_key,
              external_url,
              last_synced_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18
            )
            ON CONFLICT (id) DO UPDATE SET
              project_id = EXCLUDED.project_id,
              code = EXCLUDED.code,
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              summary = EXCLUDED.summary,
              business_summary = EXCLUDED.business_summary,
              technical_summary = EXCLUDED.technical_summary,
              status = EXCLUDED.status,
              priority = EXCLUDED.priority,
              type = EXCLUDED.type,
              assignee_id = EXCLUDED.assignee_id,
              dependencies = EXCLUDED.dependencies,
              blocker_reason = EXCLUDED.blocker_reason,
              source_type = EXCLUDED.source_type,
              external_key = EXCLUDED.external_key,
              external_url = EXCLUDED.external_url,
              last_synced_at = EXCLUDED.last_synced_at
          `,
          [
            ticket.id,
            ticket.projectId,
            ticket.code,
            ticket.title,
            ticket.description,
            ticket.summary,
            ticket.businessSummary,
            ticket.technicalSummary,
            ticket.status,
            ticket.priority,
            ticket.type,
            ticket.assigneeId,
            toJson(ticket.dependencies),
            ticket.blockerReason,
            ticket.sourceType,
            ticket.externalKey,
            ticket.externalUrl,
            ticket.lastSyncedAt
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  return tickets;
}

export async function updateTicketInPostgres(
  ticketId: string,
  updates: TicketUpdateInput
): Promise<Ticket | null> {
  await ensurePostgresReady();

  const teamMemberResult = await queryPostgres<CountRow>(
    "SELECT COUNT(*)::text AS count FROM team_members WHERE id = $1",
    [updates.assigneeId]
  );

  if (Number(teamMemberResult.rows[0]?.count ?? "0") === 0) {
    return null;
  }

  const result = await queryPostgres<{
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
    dependencies: unknown;
    blocker_reason: string;
    source_type: Ticket["sourceType"];
    external_key: string | null;
    external_url: string | null;
    last_synced_at: string | null;
  }>(
    `
      UPDATE tickets
      SET
        status = $2,
        assignee_id = $3,
        blocker_reason = $4
      WHERE id = $1
      RETURNING
        id,
        project_id,
        code,
        title,
        description,
        summary,
        business_summary,
        technical_summary,
        status,
        priority,
        type,
        assignee_id,
        dependencies,
        blocker_reason,
        source_type,
        external_key,
        external_url,
        last_synced_at
    `,
    [ticketId, updates.status, updates.assigneeId, updates.blockerReason]
  );

  return result.rows[0] ? mapTicketRow(result.rows[0]) : null;
}

export async function createTicketCommentInPostgres(
  ticketId: string,
  input: CreateTicketCommentRequest
): Promise<TicketComment | null> {
  await ensurePostgresReady();

  const [ticketResult, authorResult] = await Promise.all([
    queryPostgres<CountRow>("SELECT COUNT(*)::text AS count FROM tickets WHERE id = $1", [
      ticketId
    ]),
    queryPostgres<CountRow>(
      "SELECT COUNT(*)::text AS count FROM team_members WHERE id = $1",
      [input.authorId]
    )
  ]);

  if (
    Number(ticketResult.rows[0]?.count ?? "0") === 0 ||
    Number(authorResult.rows[0]?.count ?? "0") === 0
  ) {
    return null;
  }

  const result = await queryPostgres<{
    id: string;
    ticket_id: string;
    author_id: string;
    message: string;
    created_at: string;
  }>(
    `
      INSERT INTO ticket_comments (
        id,
        ticket_id,
        author_id,
        message,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        ticket_id,
        author_id,
        message,
        created_at
    `,
    [
      `comment-${randomUUID()}`,
      ticketId,
      input.authorId,
      input.message.trim(),
      new Date().toISOString()
    ]
  );

  return result.rows[0] ? mapTicketCommentRow(result.rows[0]) : null;
}

export async function createHandoverInPostgres(
  input: CreateHandoverRequest
): Promise<Handover | null> {
  await ensurePostgresReady();

  const [projectResult, unavailableResult, fallbackResult, ticketCountResult] =
    await Promise.all([
      queryPostgres<CountRow>("SELECT COUNT(*)::text AS count FROM projects WHERE id = $1", [
        input.projectId
      ]),
      queryPostgres<CountRow>(
        "SELECT COUNT(*)::text AS count FROM team_members WHERE id = $1",
        [input.unavailableMemberId]
      ),
      queryPostgres<CountRow>(
        "SELECT COUNT(*)::text AS count FROM team_members WHERE id = $1",
        [input.fallbackOwnerId]
      ),
      input.openTicketIds.length
        ? queryPostgres<CountRow>(
            "SELECT COUNT(*)::text AS count FROM tickets WHERE id = ANY($1::text[])",
            [input.openTicketIds]
          )
        : Promise.resolve({ rows: [{ count: "0" }] } as { rows: CountRow[] })
    ]);

  const openTicketCount = Number(ticketCountResult.rows[0]?.count ?? "0");

  if (
    Number(projectResult.rows[0]?.count ?? "0") === 0 ||
    Number(unavailableResult.rows[0]?.count ?? "0") === 0 ||
    Number(fallbackResult.rows[0]?.count ?? "0") === 0 ||
    openTicketCount !== input.openTicketIds.length
  ) {
    return null;
  }

  const result = await queryPostgres<{
    id: string;
    project_id: string;
    unavailable_member_id: string;
    fallback_owner_id: string;
    summary: string;
    open_ticket_ids: unknown;
    blockers: unknown;
  }>(
    `
      INSERT INTO handovers (
        id,
        project_id,
        unavailable_member_id,
        fallback_owner_id,
        summary,
        open_ticket_ids,
        blockers
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
      RETURNING
        id,
        project_id,
        unavailable_member_id,
        fallback_owner_id,
        summary,
        open_ticket_ids,
        blockers
    `,
    [
      `handover-${randomUUID()}`,
      input.projectId,
      input.unavailableMemberId,
      input.fallbackOwnerId,
      input.summary.trim(),
      toJson(input.openTicketIds),
      toJson(input.blockers.map((blocker) => blocker.trim()).filter(Boolean))
    ]
  );

  return result.rows[0] ? mapHandoverRow(result.rows[0]) : null;
}

export async function resetDemoWorkspaceInPostgres() {
  await ensurePostgresReady();

  await withPostgresClient(async (client) => {
    await client.query("BEGIN");

    try {
      await client.query("DELETE FROM ticket_comments");
      await client.query("DELETE FROM handovers");
      await client.query("DELETE FROM tickets");
      await client.query("DELETE FROM team_members");
      await client.query("DELETE FROM projects");
      await seedPostgresDemoScenario(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
