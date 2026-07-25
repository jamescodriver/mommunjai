-- Mommunjai Phase 2 — auth/RBAC, LINE bindings, personalized report snapshots
-- Ref: docs/PRD-PHASE2.md · deny-by-default RLS · all access via BFF service_role

-- ========== staff auth / RBAC ==========
create table if not exists staff_users (
  id           uuid primary key default gen_random_uuid(),
  username     text not null unique,
  display_name text not null,
  pin_hash     text not null,               -- scrypt$salt$hash (app-layer, see lib/auth.ts)
  role         text not null default 'staff' check (role in ('admin','staff')),
  permissions  text[] not null default '{}',-- e.g. {view_leads,manage_tags,view_reports,manage_users,line_admin}
  active       boolean not null default true,
  created_by   uuid references staff_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_login   timestamptz
);
create index if not exists idx_staff_username on staff_users(username);

-- ========== LINE binding: line user <-> lead ==========
create table if not exists line_bindings (
  id           uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  lead_id      uuid references leads(id) on delete set null,
  ticket_code  text,
  bound_at     timestamptz not null default now()
);
create index if not exists idx_line_lead on line_bindings(lead_id);

-- ========== personalized report snapshots ==========
create table if not exists reports (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- shareable, reuses ticket code (e.g. MJ-XXXXXX)
  lead_id    uuid references leads(id) on delete cascade,
  score      int,                           -- overall readiness 0..100
  payload    jsonb not null,                -- full rendered report data (see lib/report.ts)
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_code on reports(code);
create index if not exists idx_reports_lead on reports(lead_id);

-- link a lead to a LINE user directly too (denormalized convenience)
alter table leads add column if not exists line_user_id text;

-- audit trail for staff actions (who viewed/tagged which ticket)
create table if not exists staff_audit (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid references staff_users(id) on delete set null,
  action     text not null,                 -- view_ticket | add_tag | remove_tag | create_user | ...
  target     text,                          -- ticket code / username
  created_at timestamptz not null default now()
);

-- ========== RLS: deny-by-default (BFF service_role bypasses) ==========
alter table staff_users   enable row level security;
alter table line_bindings enable row level security;
alter table reports       enable row level security;
alter table staff_audit   enable row level security;
