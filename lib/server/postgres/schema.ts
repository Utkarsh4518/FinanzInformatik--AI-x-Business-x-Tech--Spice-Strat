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
      source_type TEXT NOT NULL DEFAULT 'local',
      external_key TEXT,
      external_url TEXT,
      last_synced_at TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'local'
  `,
  `
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS external_key TEXT
  `,
  `
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS external_url TEXT
  `,
  `
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS last_synced_at TEXT
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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_external_key
    ON tickets (external_key)
    WHERE external_key IS NOT NULL
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
    CREATE TABLE IF NOT EXISTS jira_sync_runs (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      project_key TEXT,
      fetched_count INTEGER NOT NULL DEFAULT 0,
      imported_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS jira_sync_items (
      id TEXT PRIMARY KEY,
      sync_run_id TEXT NOT NULL REFERENCES jira_sync_runs(id) ON DELETE CASCADE,
      external_key TEXT NOT NULL,
      action_taken TEXT NOT NULL,
      mapped_ticket_id TEXT,
      message TEXT,
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
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_jira_sync_runs_started_at
    ON jira_sync_runs (started_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_jira_sync_items_sync_run_id
    ON jira_sync_items (sync_run_id)
  `
] as const;
