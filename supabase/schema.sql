create extension if not exists vector;

create table if not exists workspaces (
  id text primary key,
  title text not null,
  role_mode text not null default 'business',
  requirement_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  is_demo boolean not null default false,
  correction_count integer not null default 0,
  last_voice_comment_at timestamptz,
  last_voice_comment_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_viewed_at timestamptz
);

create table if not exists specs (
  workspace_id text primary key references workspaces(id) on delete cascade,
  feature_name text not null,
  payload jsonb not null,
  approval_status text not null default 'draft',
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists repo_indexes (
  workspace_id text primary key references workspaces(id) on delete cascade,
  repo_url text not null,
  branch text not null,
  status text not null default 'idle',
  indexed_at timestamptz,
  total_files integer,
  embedding_count integer default 0
);

create table if not exists repo_embeddings (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  file_path text not null,
  line_start integer,
  line_end integer,
  content text not null,
  embedding vector(1536)
);

create table if not exists alignment_reports (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  source_diff text not null,
  coverage_score integer not null,
  findings jsonb not null,
  risks jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists diff_explanations (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists workspace_versions (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  spec_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists saved_templates (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists share_links (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists connection_profiles (
  id bigserial primary key,
  provider text not null,
  label text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  type text not null,
  stage text,
  message text not null,
  timestamp timestamptz not null default now()
);

create table if not exists voice_comments (
  id bigserial primary key,
  ticket_id text not null,
  workspace_id text not null references workspaces(id) on delete cascade,
  audio_url text not null,
  transcript text not null,
  translated_transcript text,
  summary text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  source_language text,
  target_language text,
  correction_requested boolean not null default false,
  correction_reason text
);

create table if not exists voice_sessions (
  id bigserial primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  transcript text not null,
  translated_transcript text,
  summary jsonb not null,
  speakers jsonb not null default '[]'::jsonb,
  started_at timestamptz not null,
  ended_at timestamptz not null
);
