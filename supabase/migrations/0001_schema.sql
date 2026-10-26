-- Core schema: profiles, pipeline_stages, leads, lead_notes, activity_logs.
-- Run in order against a fresh Supabase project (SQL editor or `supabase db push`).

create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'member');
create type approval_status as enum ('not_submitted', 'pending', 'approved', 'rejected');
create type note_kind as enum ('note', 'contact_attempt');
create type activity_action as enum (
  'lead_created',
  'lead_updated',
  'status_changed',
  'approval_status_changed',
  'assignee_changed',
  'note_added',
  'contact_attempt_recorded',
  'lead_deleted',
  'lead_restored'
);

-- One row per authenticated team member. id mirrors auth.users.id (1:1, no separate surrogate key).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role user_role not null default 'member',
  is_active boolean not null default true,
  -- Per-user UI preferences (default landing page, default filters, date/time format, theme).
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Configurable Kanban columns. `key` is a stable slug used by leads.status.
create table pipeline_stages (
  key text primary key,
  label text not null,
  color text not null default '#64748b',
  sort_order int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null check (btrim(client_name) <> ''),
  company_name text,
  email text,
  phone text,
  website text,
  source text,
  status text not null references pipeline_stages (key) on update cascade,
  approval_status approval_status not null default 'not_submitted',
  assigned_to uuid references profiles (id),
  tags text[] not null default '{}',
  follow_up_at timestamptz,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_edited_by uuid references profiles (id),
  deleted_at timestamptz,
  deleted_by uuid references profiles (id)
);

-- Normalized columns for cheap duplicate detection / search; kept in sync by trigger (0002).
alter table leads add column email_normalized text;
alter table leads add column phone_normalized text;

create index leads_status_idx on leads (status) where deleted_at is null;
create index leads_assigned_to_idx on leads (assigned_to) where deleted_at is null;
create index leads_created_at_idx on leads (created_at desc);
create index leads_follow_up_at_idx on leads (follow_up_at) where deleted_at is null;
create index leads_deleted_at_idx on leads (deleted_at);
create index leads_email_normalized_idx on leads (email_normalized) where deleted_at is null;
create index leads_phone_normalized_idx on leads (phone_normalized) where deleted_at is null;
create index leads_search_idx on leads using gin (
  to_tsvector('simple', coalesce(client_name, '') || ' ' || coalesce(company_name, ''))
);

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  author_id uuid not null references profiles (id),
  kind note_kind not null default 'note',
  note_text text not null check (btrim(note_text) <> ''),
  contact_method text,
  contact_outcome text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on lead_notes (lead_id, created_at desc);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  actor_id uuid references profiles (id),
  action activity_action not null,
  old_values jsonb,
  new_values jsonb,
  details text,
  created_at timestamptz not null default now()
);

-- No FK to leads: audit history must survive the lead row's lifecycle (soft-delete is fine,
-- but we never want a hard delete to silently cascade away the trail either).
create index activity_logs_lead_id_idx on activity_logs (lead_id, created_at desc);
create index activity_logs_actor_id_idx on activity_logs (actor_id);
