-- Mommunjai — audit detail for the new admin edit/delete-lead feature
-- Ref: app/api/leads/[id]/route.ts · additive only, never alter/drop existing columns

-- Lucifer red-team (2026-07-31): editing a health-sensitive field (stage,
-- has_pcos, art_plan, infertility_issues) previously only logged *which*
-- field changed, not the old->new values — not enough to reconstruct a
-- dispute later. This column carries that diff as jsonb; existing rows keep
-- their default '{}'::jsonb (no backfill needed, they're still readable via
-- the existing `target` text column).
alter table staff_audit add column if not exists detail jsonb default '{}'::jsonb;
