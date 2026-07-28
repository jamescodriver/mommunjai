-- Mommunjai Phase 2.1 — customer identity (PDF-05/06): a repeat questionnaire
-- submission counts as the same person, with the ability to change category.
-- Ref: docs/IMPACT-ANALYSIS-2607.md PDF-05/06 · additive only, never alters/drops
-- existing columns · forward-compatible with docs/PRD-PHASE3.md's fuller
-- customers/line_profiles design (same table name/spirit, minimal slice only)

-- ========== customer: identity anchor (1 person = 1 row, N leads) ==========
create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  primary_lead_id uuid references leads(id) on delete set null,
  line_user_id    text unique,
  current_stage   text,
  first_seen_at   timestamptz not null default now(),
  last_active_at  timestamptz not null default now()
);
create index if not exists idx_customers_line_user on customers(line_user_id);

-- link each lead submission to the customer it belongs to (nullable — old
-- rows and any lead created before this migration stay unlinked until a
-- resume/LINE-menu interaction lazily backfills them, see lib/customer.ts)
alter table leads add column if not exists customer_id uuid references customers(id) on delete set null;
create index if not exists idx_leads_customer on leads(customer_id);

-- line_bindings stays as-is for backward compat (still the source of truth
-- for "which ticket does this LINE user's typed code resolve to" today) —
-- just add a pointer to the customer it's since been resolved to
alter table line_bindings add column if not exists customer_id uuid references customers(id) on delete set null;

-- ========== RLS: deny-by-default (BFF service_role bypasses) ==========
alter table customers enable row level security;

-- fix: tool_results.tool's check constraint (0001_init.sql) was never updated
-- when the water tool shipped (PDF-17) — 'water' rows have been silently
-- rejected since. Postgres's default unnamed-constraint naming convention.
alter table tool_results drop constraint if exists tool_results_tool_check;
alter table tool_results add constraint tool_results_tool_check
  check (tool in ('ovulation','protein','nutrients','sleep','vitamins','water'));
