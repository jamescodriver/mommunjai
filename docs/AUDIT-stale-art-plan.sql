-- ═══════════════════════════════════════════════════════════════════════════
-- ตรวจ lead เก่าที่ได้ art_plan ผิดติดมา (บั๊กที่แก้ในคอมมิต 54ba570 · 1 ส.ค. 2026)
-- ═══════════════════════════════════════════════════════════════════════════
-- อาการ: /plan prefill art_plan จากโปรไฟล์เดิมใน localStorage แต่ stage 'prep'
--        กับ 'lactating' ไม่มีขั้นตอนคำถาม ART ให้เห็นหรือแก้ ค่าเก่าจึงติดไปกับการส่ง
-- ผล:    tier กระโดดเป็น medium/full → ได้แผนเต็มโดยไม่ต้องเข้า LINE + ข้อมูลผิดใน DB
--
-- ขอบเขตที่กระทบ = stage IN ('prep','lactating') AND art_plan ไม่ใช่ 'ยัง'/'none'
--   ('infertility' 'pregnant' 'male' **ไม่กระทบ** เพราะยังเจอคำถามนี้จริง จึงเป็นค่าที่ผู้ใช้ตอบเอง)
--
-- 🔒 รันทีละบล็อกและ **อ่านผลก่อน** จะแก้ · บล็อก C/D เปลี่ยนข้อมูลจริง
-- ═══════════════════════════════════════════════════════════════════════════


-- ── A. ตรวจก่อน: มีกี่ราย แยกตามช่วงชีวิตและค่าที่ค้าง (อ่านอย่างเดียว) ────────
select
  stage,
  art_plan,
  count(*)                                   as จำนวน,
  min(created_at)::date                      as รายแรก,
  max(created_at)::date                      as รายล่าสุด,
  -- tier ที่ระบบคำนวณให้ตอนนั้น (ตรรกะเดียวกับ lib/report.ts § reportTier)
  case
    when art_plan in ('IVF-ICSI','เตรียมผนังมดลูก','ivf','icsi') then 'full  ← ได้แผนเต็มฟรี'
    when art_plan in ('IUI','บำรุงไข่','iui')                     then 'medium'
    else 'teaser'
  end                                        as tier_ที่ได้ไปจริง
from leads
where stage in ('prep','lactating')
  and art_plan is not null
  and art_plan not in ('ยัง','none')
group by stage, art_plan
order by จำนวน desc;


-- ── B. รายตัว: เอาไว้ให้แอดมินไล่ดู (ไม่ดึง PII เกินจำเป็น) ─────────────────
select
  l.id,
  l.created_at::date  as วันที่,
  l.stage,
  l.art_plan          as ค่าที่ค้างผิด,
  t.code              as รหัส_ticket,
  (r.id is not null)  as มีรายงานที่แชร์ไปแล้ว
from leads l
left join tickets t on t.lead_id = l.id
left join reports r on r.lead_id = l.id
where l.stage in ('prep','lactating')
  and l.art_plan is not null
  and l.art_plan not in ('ยัง','none')
order by l.created_at desc;


-- ── C. แก้ข้อมูลใน leads ให้ตรงความจริง (รันเมื่อดู A/B แล้วโอเค) ─────────────
-- เหตุผลที่ต้องแก้: แอดมินเปิด /leads แล้วเห็นว่าแม่ให้นมคนนี้ "อยู่ระหว่าง IVF-ICSI"
-- ซึ่งไม่จริง — เธอไม่เคยถูกถามคำถามนี้เลย · การปล่อยไว้ทำให้คุยกับลูกค้าผิดเรื่อง
begin;
  -- เก็บสำเนาไว้ก่อน เผื่ออยากย้อนดูว่าเดิมเป็นอะไร (ตารางชั่วคราว ลบทีหลังได้)
  create table if not exists leads_art_plan_backup_20260801 as
  select id, stage, art_plan, created_at
  from leads
  where stage in ('prep','lactating')
    and art_plan is not null and art_plan not in ('ยัง','none');

  update leads
  set art_plan = 'ยัง'
  where stage in ('prep','lactating')
    and art_plan is not null and art_plan not in ('ยัง','none');
commit;


-- ── D. ตรวจหลังแก้ ต้องได้ 0 แถว ────────────────────────────────────────────
select count(*) as เหลือที่ยังผิด
from leads
where stage in ('prep','lactating')
  and art_plan is not null and art_plan not in ('ยัง','none');


-- ═══════════════════════════════════════════════════════════════════════════
-- ❗️ สิ่งที่ **จงใจไม่แก้** และเหตุผล
-- ═══════════════════════════════════════════════════════════════════════════
-- 1) reports.payload (รายงานที่ snapshot ไว้)
--    ลูกค้าได้เห็น/ได้รับลิงก์ /r/<code> ฉบับนั้นไปแล้ว การไปแก้ย้อนหลังทำให้
--    สิ่งที่เขาเปิดดูวันนี้ ไม่ตรงกับสิ่งที่แอดมินเคยคุยด้วย → สับสนกว่าเดิม
--    ถ้าอยากให้ตรง ให้ "ออกรายงานใหม่" (ทำแบบสอบถามใหม่) แทนการแก้ของเก่า
--
-- 2) tickets / tag_assignments
--    เป็นบันทึกเหตุการณ์ตามเวลา ไม่ใช่สถานะปัจจุบัน — แก้ย้อนหลังจะทำให้ audit เพี้ยน
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 สินค้าที่หลุดเข้าไปในแผน (จากการรันโค้ดจริงเทียบทีละค่า)
-- ═══════════════════════════════════════════════════════════════════════════
--   art_plan = IUI / IVF-ICSI / บำรุงไข่   → เพิ่ม A.O.S
--   art_plan = เตรียมผนังมดลูก             → เพิ่ม A.O.S + Colla Telo + ดอกคำฝอย + น้ำมันละหุ่ง
--
-- ✅ ตรวจกับ Safety Matrix ของแบรนด์เอง (docs/product-catalog-master.md §4) แล้ว:
--    ช่วง "ให้นม" แบรนด์ระบุให้หยุดเฉพาะ **Varginaree** ตัวเดียว — ซึ่งไม่ได้หลุดเข้ามา
--    และดอกคำฝอย เอกสารแบรนด์ระบุเองว่า "หลังคลอดทานขับน้ำคาวปลา"
--    → **ไม่ใช่การละเมิดกฎความปลอดภัยของแบรนด์** ผลกระทบคือ "แนะนำผิดบริบท"
--      (A.O.S พาดหัวว่า "ดูแลคุณภาพไข่และตัวอ่อน" ไปโผล่ในแผนแม่หลังคลอด) ไม่ใช่อันตราย
--    ⚠️ แต่ถ้าอยากให้เภสัชของแบรนด์ยืนยันอีกชั้นว่าช่วงให้นมควรหยุดอะไรเพิ่ม
--       ให้ถามแล้วอัปเดตทั้ง docs/product-catalog-master.md §4 และ stop rules
--       ใน lib/calc/vitamins.ts พร้อมกัน (สองที่นี้ต้องตรงกันเสมอ)
