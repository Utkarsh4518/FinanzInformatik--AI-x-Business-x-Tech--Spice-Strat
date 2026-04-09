export const postgresSchemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      objective TEXT NOT NULL,
      manager_brief TEXT NOT NULL,
      business_summary TEXT NOT NULL,
      technical_summary TEXT NOT NULL,
      manager_summary TEXT NOT NULL,
      languages JSONB NOT NULL DEFAULT '[]'::jsonb,
      primary_view TEXT NOT NULL,
      secondary_view TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      availability_status TEXT NOT NULL,
      capacity_percent INTEGER NOT NULL,
      focus TEXT NOT NULL,
      languages JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      summary TEXT NOT NULL,
      business_summary TEXT NOT NULL,
      technical_summary TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      type TEXT NOT NULL,
      assignee_id TEXT NOT NULL REFERENCES team_members(id),
      dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
      blocker_reason TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES team_members(id),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS handovers (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      unavailable_member_id TEXT NOT NULL REFERENCES team_members(id),
      fallback_owner_id TEXT NOT NULL REFERENCES team_members(id),
      summary TEXT NOT NULL,
      open_ticket_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_tickets_project_id
    ON tickets (project_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id
    ON tickets (assignee_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id
    ON ticket_comments (ticket_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_handovers_project_id
    ON handovers (project_id)
  `
] as const;
