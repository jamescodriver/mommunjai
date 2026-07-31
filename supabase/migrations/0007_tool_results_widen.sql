-- Mommunjai R3 — เปิดให้ tool_results เก็บผลของเครื่องมือที่สร้างเพิ่มหลัง 0003
-- Ref: docs/PRD-UPDATE-R3-3107.md §Open Questions ข้อ 6 · additive only
--
-- ปัญหาที่แก้: CHECK constraint ตัวเดิม (0003) มีแค่ 6 เครื่องมือ แต่ตอนนี้แอปมี 9
-- → ผลของ `exercise` (แนะนำการออกกำลังกาย) และ `labs` (ตรวจร่างกาย) ถูกกรองทิ้งเงียบ ๆ
--   ที่ allowlist ใน app/api/lead/route.ts มาตลอด แอดมินจึงไม่เคยเห็นข้อมูล 2 ตัวนี้เลย
-- ⚠️ ลำดับสำคัญ: ต้องรัน migration นี้ **ก่อน** deploy โค้ดที่เพิ่ม 3 ค่านี้เข้า allowlist
--    ไม่งั้น insert จะชน constraint แล้วทั้ง submission กลายเป็น 500
--
-- `stress` — เก็บเฉพาะคะแนนรวม+ระดับ ไม่เก็บคำตอบรายข้อ (ดู app/tools/stress/page.tsx)
--    และข้อความ consent ถูกขยายให้ครอบคลุมความเครียดแล้วใน lib/disclaimer.ts
--    (CONSENT_POLICY_VERSION ขึ้นเป็น 2026-07-31)

alter table tool_results drop constraint if exists tool_results_tool_check;
alter table tool_results add constraint tool_results_tool_check
  check (tool in ('ovulation','protein','nutrients','sleep','vitamins','water','exercise','labs','stress'));
