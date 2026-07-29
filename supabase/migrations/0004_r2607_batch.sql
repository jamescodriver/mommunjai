-- Mommunjai — PRD-UPDATE-R2-2607.md batch (R2/R4): infertility checklist +
-- the new 5-value ART-plan question. Additive only — never alters/drops an
-- existing column, matching 0001–0003. Not yet applied to any project
-- (same status as 0001–0003 at the time this was written).

-- ========== R4: art_plan's CHECK constraint widened, old values kept valid ==========
-- Old leads still hold 'none'|'iui'|'ivf'|'icsi' — the constraint must accept both
-- the old and new value sets so existing rows don't get orphaned by this migration.
-- (App-layer mapping for display/rebuild lives in lib/calc/vitamins.ts's
-- mapLegacyArtPlan(); this constraint only guards what can be written going forward.)
alter table leads drop constraint if exists leads_art_plan_check;
alter table leads add constraint leads_art_plan_check
  check (art_plan in ('none','iui','ivf','icsi','ยัง','IUI','IVF-ICSI','บำรุงไข่','เตรียมผนังมดลูก'));

-- ========== R2: "มีบุตรยาก" 7-item issue checklist ==========
alter table leads add column if not exists infertility_issues jsonb default '[]'::jsonb;

-- ========== R3: height, only ever collected after the "น้ำหนักเกิน" checkbox ==========
-- Internal-only (BMI tiering, see lib/calc/bmi.ts) — never displayed as a number.
alter table leads add column if not exists height_cm numeric;

-- ========== R2/R4 tag seeds — additive, mirrors the pattern in 0001_init.sql ==========
insert into tags (slug, label, kind, color) values
  ('#บำรุงไข่','วางแผนบำรุงไข่','auto','#E7B84B'),
  ('#เตรียมผนังมดลูก','เตรียมผนังมดลูก','auto','#E7B84B')
on conflict (slug) do nothing;
