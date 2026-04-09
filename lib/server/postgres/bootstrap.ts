import type { PoolClient } from "pg";

import {
  bridgeFlowHandover,
  bridgeFlowProject,
  bridgeFlowTeamMembers,
  bridgeFlowTicketComments,
  bridgeFlowTickets
} from "@/lib/seed/bridgeflow-data";
import { withPostgresClient } from "@/lib/server/postgres/client";
import { toJson } from "@/lib/server/postgres/mappers";
import { postgresSchemaStatements } from "@/lib/server/postgres/schema";

declare global {
  // eslint-disable-next-line no-var
  var __bridgeFlowPostgresBootstrapPromise: Promise<void> | undefined;
}

export async function seedPostgresDemoScenario(client: PoolClient) {
  await client.query(
    `
      INSERT INTO projects (
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
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        objective = EXCLUDED.objective,
        manager_brief = EXCLUDED.manager_brief,
        business_summary = EXCLUDED.business_summary,
        technical_summary = EXCLUDED.technical_summary,
        manager_summary = EXCLUDED.manager_summary,
        languages = EXCLUDED.languages,
        primary_view = EXCLUDED.primary_view,
        secondary_view = EXCLUDED.secondary_view
    `,
    [
      bridgeFlowProject.id,
      bridgeFlowProject.name,
      bridgeFlowProject.code,
      bridgeFlowProject.objective,
      bridgeFlowProject.managerBrief,
      bridgeFlowProject.businessSummary,
      bridgeFlowProject.technicalSummary,
      bridgeFlowProject.managerSummary,
      toJson(bridgeFlowProject.languages),
      bridgeFlowProject.primaryView,
      bridgeFlowProject.secondaryView
    ]
  );

  for (const member of bridgeFlowTeamMembers) {
    await client.query(
      `
        INSERT INTO team_members (
          id,
          name,
          role,
          availability_status,
          capacity_percent,
          focus,
          languages
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          availability_status = EXCLUDED.availability_status,
          capacity_percent = EXCLUDED.capacity_percent,
          focus = EXCLUDED.focus,
          languages = EXCLUDED.languages
      `,
      [
        member.id,
        member.name,
        member.role,
        member.availabilityStatus,
        member.capacityPercent,
        member.focus,
        toJson(member.languages)
      ]
    );
  }

  for (const ticket of bridgeFlowTickets) {
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

  for (const comment of bridgeFlowTicketComments) {
    await client.query(
      `
        INSERT INTO ticket_comments (
          id,
          ticket_id,
          author_id,
          message,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          ticket_id = EXCLUDED.ticket_id,
          author_id = EXCLUDED.author_id,
          message = EXCLUDED.message,
          created_at = EXCLUDED.created_at
      `,
      [
        comment.id,
        comment.ticketId,
        comment.authorId,
        comment.message,
        comment.createdAt
      ]
    );
  }

  await client.query(
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
      ON CONFLICT (id) DO UPDATE SET
        project_id = EXCLUDED.project_id,
        unavailable_member_id = EXCLUDED.unavailable_member_id,
        fallback_owner_id = EXCLUDED.fallback_owner_id,
        summary = EXCLUDED.summary,
        open_ticket_ids = EXCLUDED.open_ticket_ids,
        blockers = EXCLUDED.blockers
    `,
    [
      bridgeFlowHandover.id,
      bridgeFlowHandover.projectId,
      bridgeFlowHandover.unavailableMemberId,
      bridgeFlowHandover.fallbackOwnerId,
      bridgeFlowHandover.summary,
      toJson(bridgeFlowHandover.openTicketIds),
      toJson(bridgeFlowHandover.blockers)
    ]
  );
}

async function bootstrapPostgres() {
  await withPostgresClient(async (client) => {
    await client.query("BEGIN");

    try {
      for (const statement of postgresSchemaStatements) {
        await client.query(statement);
      }

      const projectCountResult = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM projects"
      );
      const projectCount = Number(projectCountResult.rows[0]?.count ?? "0");

      if (projectCount === 0) {
        await seedPostgresDemoScenario(client);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function ensurePostgresReady() {
  if (!global.__bridgeFlowPostgresBootstrapPromise) {
    global.__bridgeFlowPostgresBootstrapPromise = bootstrapPostgres().catch((error) => {
      global.__bridgeFlowPostgresBootstrapPromise = undefined;
      throw error;
    });
  }

  await global.__bridgeFlowPostgresBootstrapPromise;
}
