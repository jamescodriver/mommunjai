-- Mommunjai — PRD-UPDATE-R3-3107.md batch (R4/R6/R7/R9): ฟิลด์โปรไฟล์ชุดใหม่
-- ที่แบบสอบถามเก็บเพิ่ม (น้ำหนัก/การนอน/ออกกำลังกาย/PCOS 3 สถานะ/พฤติกรรมฝ่ายชาย/
-- ข้อมูลคู่/ข้อมูลคนท้อง) — additive only เหมือน 0001–0005 ไม่มี alter/drop คอลัมน์เดิม

alter table leads add column if not exists weight_kg          numeric;
alter table leads add column if not exists sleep_bedtime      text;      -- "HH:MM"
alter table leads add column if not exists sleep_waketime     text;      -- "HH:MM"
alter table leads add column if not exists exercise_freq      text;      -- '0' | '1-2' | '3-4' | 'daily'
alter table leads add column if not exists pcos_status        text;      -- 'yes' | 'unsure' | 'no'
alter table leads add column if not exists behaviors          jsonb default '[]'::jsonb;  -- stage=male: ['smoke','alcohol','stress']
alter table leads add column if not exists partner_profile    jsonb default '{}'::jsonb;  -- R7: ข้อมูลฝ่ายชายเมื่อติ๊ก male_factor
alter table leads add column if not exists conception_method  text;      -- pregnant
alter table leads add column if not exists gestational_weeks  integer;   -- pregnant
alter table leads add column if not exists has_gdm            boolean default false; -- pregnant

-- หมายเหตุ (ตาม PRD §Data Model)
-- • `has_pcos` (boolean เดิม) **คงไว้** เพื่อ backward compat — /api/lead เขียนค่าคู่กันเสมอ
--   (has_pcos = pcos_status === 'yes') ข้อมูลเก่าและ logic เดิมจึงอ่านได้เหมือนเดิมทุกประการ
-- • `partner_profile` เก็บเป็น jsonb ก้อนเดียว (weight/height/sleep/exercise/behaviors)
--   แทนการเพิ่ม 6 คอลัมน์ — เป็นข้อมูลของ "คนละคน" กับเจ้าของ record ห้ามเขียนทับกัน
-- • ไม่ตั้ง CHECK constraint กับ pcos_status/exercise_freq/conception_method เพราะ R9/P2
--   จะเติมตัวเลือกใหม่ (IUI / บำรุงไข่ / เตรียมผนัง) ทีหลัง — validate ที่ชั้นแอป
--   (lib/calc/vitamins.ts) แทน จะได้ไม่ต้องแก้ schema ทุกครั้งที่แบรนด์เพิ่มตัวเลือก
