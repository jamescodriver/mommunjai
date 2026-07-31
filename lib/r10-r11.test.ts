import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generateReport, buildTeaser, type Report } from "./report";
import {
  trimesterFromWeeks, buildPregnancyKnowledge, BANANA_FLOWER_MIN_WEEKS,
  GO_NOW, KICK_ALWAYS_VISIBLE_SAFETY, TRIMESTER_DEVELOPMENT, NUTRIENT_FOCUS, PREGNANCY_PRODUCT_IDS,
} from "./calc/pregnancy";
import {
  buildLactationKnowledge, NOURISHMENT_TITLE, LACTATION_PRODUCT_IDS, MILK_CODE_RULES,
} from "./calc/lactation";
import { productsForStage, PRODUCTS, recommendVitamins, STAGE_CORE_PREGNANT, STAGE_CORE_LACTATING } from "./calc/vitamins";

const readFile = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");
/** ตัดคอมเมนต์ออก เพื่อให้สแกนเฉพาะ "สิ่งที่ผู้ใช้เห็น" ไม่ใช่กติกาที่เขียนกำกับไว้ */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ═══════════════════════════════════════════════════════════════════════════
// R10 — ตั้งครรภ์
// ═══════════════════════════════════════════════════════════════════════════

describe("R10 — ไตรมาสจากอายุครรภ์ (TC-10-02)", () => {
  // ขอบเขต ACOG คือ 13+6 / 27+6 → เก็บเป็นสัปดาห์เต็ม: 1–13 / 14–27 / 28+
  it("ขอบเขตไตรมาสตรงตาม ACOG ทุกจุดตัด", () => {
    expect(trimesterFromWeeks(1)).toBe(1);
    expect(trimesterFromWeeks(13)).toBe(1);
    expect(trimesterFromWeeks(14)).toBe(2);
    expect(trimesterFromWeeks(27)).toBe(2);
    expect(trimesterFromWeeks(28)).toBe(3);
    expect(trimesterFromWeeks(40)).toBe(3);
    expect(trimesterFromWeeks(42)).toBe(3);
  });
  it("ไม่กรอก/ค่าใช้ไม่ได้ → null (ห้ามเดาไตรมาสให้)", () => {
    expect(trimesterFromWeeks(undefined)).toBeNull();
    expect(trimesterFromWeeks(null)).toBeNull();
    expect(trimesterFromWeeks(0)).toBeNull();
    expect(trimesterFromWeeks(-3)).toBeNull();
    expect(trimesterFromWeeks(NaN)).toBeNull();
  });
  it("เนื้อหาพัฒนาการแสดงเฉพาะไตรมาสของผู้ใช้ · ไม่รู้ไตรมาสก็ยังมีข้อมูลครบทั้ง 3", () => {
    const k20 = buildPregnancyKnowledge({ gestationalWeeks: 20 });
    expect(k20.trimester).toBe(2);
    expect(k20.development?.trimester).toBe(2);
    expect(k20.allDevelopment).toHaveLength(3);

    const kNone = buildPregnancyKnowledge({});
    expect(kNone.trimester).toBeNull();
    expect(kNone.development).toBeNull();
    expect(kNone.allDevelopment).toHaveLength(3);
    expect(kNone.trimesterNote).toMatch(/ยังไม่ได้กรอกอายุครรภ์/);
  });
});

describe("R10 — น้ำหัวปลี ≥16 สัปดาห์ (TC-10-03)", () => {
  const ids = (w?: number) => buildPregnancyKnowledge({ gestationalWeeks: w }).products.map((p) => p.product.id);

  it("ต่ำกว่า 16 สัปดาห์ → ไม่มีน้ำหัวปลี", () => {
    for (const w of [1, 8, 15]) expect(ids(w)).not.toContain("bananaflower");
  });
  it("16 สัปดาห์พอดี และมากกว่า → มีน้ำหัวปลี", () => {
    expect(BANANA_FLOWER_MIN_WEEKS).toBe(16);
    for (const w of [16, 20, 36]) expect(ids(w)).toContain("bananaflower");
  });
  it("ไม่กรอกอายุครรภ์ → ไม่เพิ่มน้ำหัวปลี (ไม่เดาแทนผู้ใช้)", () => {
    expect(ids(undefined)).not.toContain("bananaflower");
  });
  it("ชุดพื้นฐานครบ 4 ตัวตาม PRD ทุกกรณี", () => {
    for (const w of [undefined, 10, 30]) {
      expect(ids(w)).toEqual(expect.arrayContaining(["goatmilk", "ferty", "ferti9oil", "probiotics"]));
    }
  });
  it("น้ำหัวปลีใน R10 ต้องไม่มีคำเคลมสรรพคุณ (ทีมยังไม่ได้ให้เหตุผล — บรีฟ §13)", () => {
    const bf = buildPregnancyKnowledge({ gestationalWeeks: 20 }).products.find((p) => p.product.id === "bananaflower");
    expect(bf?.note).toMatch(/รอทีมยืนยัน/);
    expect(bf?.note).not.toMatch(/เพิ่มน้ำนม|บำรุงน้ำนม|ช่วยให้ลูก/);
  });
});

describe("R10 — สารอาหาร: ตัวเลขชุดเดียวตลอดการตั้งครรภ์", () => {
  it("🔒 ตัวเลขไม่เปลี่ยนตามไตรมาส (ห้ามประดิษฐ์ 3 ชุด)", () => {
    const sets = [8, 20, 34].map((w) => buildPregnancyKnowledge({ gestationalWeeks: w }).nutrients.items);
    expect(sets[0]).toEqual(sets[1]);
    expect(sets[1]).toEqual(sets[2]);
  });
  it("สิ่งที่ต่างตามไตรมาสคือ \"เหตุผล\" ไม่ใช่ตัวเลข", () => {
    const f1 = buildPregnancyKnowledge({ gestationalWeeks: 8 }).nutrients.focus;
    const f3 = buildPregnancyKnowledge({ gestationalWeeks: 34 }).nutrients.focus;
    expect(f1?.trimester).toBe(1);
    expect(f3?.trimester).toBe(3);
    expect(f1).not.toEqual(f3);
    expect(NUTRIENT_FOCUS).toHaveLength(3);
    // เหตุผลของแต่ละไตรมาสต้องไม่ว่างเปล่า
    for (const f of NUTRIENT_FOCUS) expect(f.focus.length).toBeGreaterThan(0);
  });
  it("ต้องมีประโยคอธิบายว่าทำไมไม่มีตัวเลขรายไตรมาส + คำเตือนการอ่านเลขแคลเซียมผิด", () => {
    const n = buildPregnancyKnowledge({ gestationalWeeks: 34 }).nutrients;
    expect(n.noTrimesterNumbers).toMatch(/ไม่ได้เปลี่ยนตามไตรมาส/);
    expect(n.calciumMisreadWarning).toMatch(/ไม่ใช่ปริมาณที่แม่ต้องกินเพิ่ม/);
    // ACOG เตือนเรื่องวิตามินบำรุงครรภ์เกินขนาด — แอปนี้ขายอาหารเสริม จึงต้องมี
    expect(n.supplementWarnings.join(" ")).toMatch(/วิตามินเอ/);
  });
  it("ไม่มีคำแนะนำแคลเซียมเสริมของ WHO (ยังไม่ยืนยันว่าคนไทยเข้าข่าย low calcium intake)", () => {
    const json = JSON.stringify(buildPregnancyKnowledge({ gestationalWeeks: 24 }));
    expect(json).not.toMatch(/1\.5–2\.0 ก|1,500–2,000 มิลลิกรัม/);
  });
});

describe("R10 — นับลูกดิ้น 2 โหมด (มติ client 31/7)", () => {
  const k = buildPregnancyKnowledge({ gestationalWeeks: 30 });

  it("มี 2 โหมดให้เลือก และแต่ละโหมดมีป้ายกำกับที่มา (*) ตามที่สเปกล็อกไว้", () => {
    expect(k.kick.modes.map((m) => m.id)).toEqual(["count", "pattern"]);
    const count = k.kick.modes.find((m) => m.id === "count")!;
    const pattern = k.kick.modes.find((m) => m.id === "pattern")!;
    expect(count.provenance).toBe(
      "* วิธีนับแบบเดิมที่แพร่หลาย — เดิมเป็นเพียงแนวทางสำรองสำหรับแม่ที่ไม่แน่ใจ ไม่ใช่เกณฑ์วินิจฉัย",
    );
    expect(pattern.provenance).toBe(
      "* RCOG Green-top Guideline No. 57 ฉบับที่ 2 (เมษายน 2026) — ระดับหลักฐาน Grade A",
    );
  });

  it("🔒 ข้อความความปลอดภัย 3 ข้ออยู่นอก toggle (เป็นฟิลด์ระดับบน ไม่ผูกกับโหมดใด)", () => {
    expect(k.kick.alwaysVisibleSafety).toHaveLength(3);
    expect(KICK_ALWAYS_VISIBLE_SAFETY).toEqual(k.kick.alwaysVisibleSafety);
    // ต้องไม่ถูกซ่อนอยู่ในโหมดใดโหมดหนึ่ง — ไม่งั้นสลับโหมดแล้วหาย
    for (const m of k.kick.modes) {
      const mj = JSON.stringify(m);
      for (const s of k.kick.alwaysVisibleSafety) expect(mj).not.toContain(s);
    }
    const text = k.kick.alwaysVisibleSafety.join(" ");
    expect(text).toMatch(/ไม่มีตัวเลขมาตรฐาน/);
    expect(text).toMatch(/ติดต่อโรงพยาบาลทันที/);
    expect(text).toMatch(/ไปตรวจซ้ำ/);
  });

  it("🔒 โหมดนับเลขห้ามมีการตัดสินผล (ปกติ/ผ่าน/ติ๊กถูก)", () => {
    const count = JSON.stringify(k.kick.modes.find((m) => m.id === "count"));
    expect(count).not.toMatch(/ปกติ|ผ่าน|✅|เรียบร้อยแล้ว/);
    expect(k.kick.noVerdictRule).toMatch(/ไม่มีการสรุปว่าปกติหรือผิดปกติ/);
  });

  it("🔒 หน้าจอโหมดนับเลขไม่มีคำตัดสินผลและไม่มีเกณฑ์ผ่านในโค้ด UI", () => {
    // ตัดคอมเมนต์ออกก่อน — กติกาห้ามอยู่ในคอมเมนต์ได้ ห้ามอยู่ในสิ่งที่ผู้ใช้เห็น
    const src = stripComments(readFile("components/knowledge-pregnancy.tsx"));
    // ตัวนับต้องไม่มีการเปรียบเทียบกับเลขเกณฑ์ใด ๆ (count >= 10 ฯลฯ)
    expect(src).not.toMatch(/count\s*[><]=?\s*\d/);
    expect(src).not.toMatch(/ครบแล้ว|ผ่านเกณฑ์|ปกติดี/);
  });

  it("ไม่บอกว่า \"ก่อน 28 สัปดาห์ไม่ต้องสนใจ\" — ผิดปกติเมื่อไหร่ก็ติดต่อแพทย์", () => {
    expect(k.kick.gestationNote).toMatch(/ไม่ว่าอายุครรภ์เท่าไหร่/);
  });
});

describe("🔒 R10 — สัญญาณอันตราย (เนื้อหาเสี่ยงสูงสุดในแอป)", () => {
  const d = buildPregnancyKnowledge({ gestationalWeeks: 30 }).danger;

  it("ทุกข้อ = ไปโรงพยาบาลทันที · ไม่มีข้อไหนเป็น \"รอดูอาการ\"", () => {
    expect(d.signs.length).toBeGreaterThanOrEqual(13);
    for (const s of d.signs) {
      expect(s.action, s.sign).toBe(GO_NOW);
      const text = `${s.sign} ${s.detail} ${s.why}`;
      expect(text, s.sign).not.toMatch(/รอดูอาการ|ค่อยไปหาหมอ|ถ้าไม่ดีขึ้น|รอสังเกตอาการ|ไม่ต้องรีบ/);
    }
  });

  it("ครอบคลุมข้อที่รายการไทย 7 ข้อขาด (หัวใจ/ลิ่มเลือด/สุขภาพจิต/ไข้)", () => {
    const all = d.signs.map((s) => s.sign).join(" | ");
    expect(all).toMatch(/ไข้/);
    expect(all).toMatch(/เจ็บหน้าอก|ใจสั่น/);
    expect(all).toMatch(/ขาหรือแขนบวม/);
    expect(all).toMatch(/ทำร้ายตัวเอง/);
    expect(all).toMatch(/เหนื่อยล้า/);
  });

  it("ยืมถ้อยคำทางการไทยจากสมุดสีชมพูมาใช้จริง", () => {
    const thai = d.signs.filter((s) => s.source === "สมุดสีชมพู กรมอนามัย");
    expect(thai.length).toBeGreaterThanOrEqual(4);
    const all = thai.map((s) => `${s.sign} ${s.detail}`).join(" | ");
    expect(all).toMatch(/ตาพร่ามัว จุกแน่นยอดอก/);
    expect(all).toMatch(/ใส่ผ้าอนามัยไว้/);
    expect(all).toMatch(/กดแล้วบุ๋ม/);
    expect(all).toMatch(/ปัสสาวะแสบขัด/);
  });

  it("มีของ ACOG/RCOG ที่รายการทางการไทยไม่มี (คลอดก่อนกำหนด · ท้องนอกมดลูก · คันจาก ICP)", () => {
    const all = d.signs.map((s) => s.sign).join(" | ");
    expect(all).toMatch(/คลอดก่อนกำหนด/);
    expect(all).toMatch(/ปวดไหล่|ปวดเชิงกราน/);
    expect(all).toMatch(/คันมาก/);
  });

  it("🇹🇭 CTA หลักคือ \"ไปโรงพยาบาล\" ไม่ใช่ \"โทร 1669\" (บรีฟ §5.1)", () => {
    expect(d.cta.primary).toMatch(/โรงพยาบาล/);
    expect(d.cta.primary).not.toMatch(/1669/);
    // 1669 ใช้ได้เฉพาะชั้นวิกฤต และห้ามเขียนคำว่า "ฟรี" (ยืนยันไม่ได้ — บรีฟ §15.2)
    expect(d.cta.critical).toMatch(/1669/);
    expect(d.cta.critical).toMatch(/ชัก|หมดสติ/);
    expect(JSON.stringify(d.cta)).not.toMatch(/ฟรี|1330/);
  });

  it("มีประโยคปิดท้ายของ CDC + กติกาว่าแอปจะไม่ประเมินความรุนแรงให้", () => {
    expect(d.cta.closing).toMatch(/ไม่ได้ครอบคลุมทุกอาการ/);
    expect(d.cta.noWaitRule).toMatch(/ไม่ประเมินให้/);
    expect(d.timeframeNote).toMatch(/1 ปีหลังคลอด/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R11 — ให้นมบุตร
// ═══════════════════════════════════════════════════════════════════════════

describe("R11 — เปลี่ยนกรอบ \"อาหารเพิ่มน้ำนม\" เป็น \"อาหารบำรุงแม่หลังคลอด\"", () => {
  const k = buildLactationKnowledge();

  it("ชื่อหัวข้อเปลี่ยนแล้วจริง", () => {
    expect(NOURISHMENT_TITLE).toBe("อาหารบำรุงแม่หลังคลอด");
    expect(k.nourishment.title).toBe("อาหารบำรุงแม่หลังคลอด");
  });

  it("ชื่อเดิมปรากฏได้เฉพาะในประโยคที่อธิบายว่าทำไมถึงเปลี่ยน", () => {
    const { reframeNote, ...rest } = k.nourishment;
    expect(JSON.stringify(rest)).not.toContain("อาหารเพิ่มน้ำนม");
    expect(reframeNote).toContain("อาหารเพิ่มน้ำนม");
  });

  it("พระเอกของหน้าคือการระบายน้ำนมออกบ่อยและเกลี้ยง ไม่ใช่สินค้า", () => {
    expect(k.nourishment.whatWorks.headline).toMatch(/ระบายน้ำนมออกบ่อยและเกลี้ยง/);
    expect(k.nourishment.whatWorks.order.length).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(k.nourishment.whatWorks)).not.toMatch(/หัวปลี|ซุปไก่ดำ|ขิงทอง/);
  });

  it("ใช้ +450–500 แคลอรี่/วัน (ACOG) เป็นเหตุผลของการบำรุง โดยไม่แตะเรื่องน้ำนม", () => {
    expect(k.nourishment.energy.headline).toMatch(/450–500 แคลอรี่/);
    expect(k.nourishment.energy.source).toMatch(/ACOG/);
    expect(k.nourishment.energy.headline).not.toMatch(/น้ำนม/);
  });

  it("ระบุจุดยืนขององค์กรวิชาชีพว่าแนะนำสมุนไพรตัวใดไม่ได้", () => {
    expect(k.nourishment.consensus).toMatch(/ยังไม่สามารถแนะนำสมุนไพร/);
    expect(k.nourishment.myths.map((m) => m.fact).join(" ")).toMatch(/ดื่มน้ำเพิ่มไม่ได้ช่วย/);
  });
});

describe("🔒 R11 — ห้ามผูกคำเคลมเพิ่มน้ำนมกับสินค้าใด ๆ", () => {
  const k = buildLactationKnowledge();
  const CLAIM = /เพิ่มน้ำนม|น้ำนมเยอะ|เรียกน้ำนม|กระตุ้นน้ำนม|บำรุงน้ำนม|น้ำนมมากขึ้น|น้ำนมพุ่ง/;

  it("การ์ดสินค้าทุกใบไม่มีคำเคลมเรื่องปริมาณน้ำนม", () => {
    for (const p of k.products) {
      const text = [p.product.why, p.product.detail, p.product.howto, p.product.caution, p.amount, p.note]
        .filter(Boolean).join(" ");
      expect(text, p.product.name).not.toMatch(CLAIM);
    }
  });

  it("หัวปลี — ต้องบอกตรง ๆ ว่างานวิจัยทดสอบแล้วไม่ได้ผล และไม่มีคำเคลมในฟิลด์อื่น", () => {
    const w = k.nourishment.thaiWisdom.find((x) => x.name === "หัวปลี")!;
    expect(w.evidence).toMatch(/ไม่ได้ทำให้ปริมาณน้ำนมมากขึ้น/);
    expect(w.evidence).toMatch(/0\.73/);
    // ฟิลด์ที่ไม่ใช่ "หลักฐาน" ห้ามมีคำเคลมเลย
    expect(`${w.tradition} ${w.howWePresentIt}`).not.toMatch(CLAIM);
  });

  it("ซุปไก่ดำ — ไม่มีงานวิจัย จึงขายเป็นอาหารบำรุงกำลังเท่านั้น", () => {
    const w = k.nourishment.thaiWisdom.find((x) => x.name === "ซุปไก่ดำ")!;
    expect(w.evidence).toMatch(/ไม่พบงานวิจัย/);
    expect(`${w.tradition} ${w.howWePresentIt}`).not.toMatch(CLAIM);
    const p = k.products.find((x) => x.product.id === "blackchickensoup")!;
    expect(p.note).toMatch(/บำรุงกำลัง/);
  });

  it("ขิง — เคลมได้แค่เพดานที่บรีฟกำหนด (บวก 3 วันแรก แล้วหายไปวันที่ 7)", () => {
    const w = k.nourishment.thaiWisdom.find((x) => x.name === "ขิง")!;
    expect(w.evidence).toMatch(/วันที่ 3/);
    expect(w.evidence).toMatch(/ไม่คงอยู่ถึงวันที่ 7/);
    expect(w.howWePresentIt).toMatch(/ไม่คงอยู่ถึงวันที่ 7/);
  });

  it("ทั้งเอกสารไม่มีคำว่า Domperidone (ยาที่ห้ามปรากฏในแอปผู้บริโภค)", () => {
    expect(JSON.stringify(k).toLowerCase()).not.toContain("domperidone");
  });
});

describe("🔴 R11 — พ.ร.บ.นมผง (ตัวแอปเองมีโทษจำคุกได้)", () => {
  const k = buildLactationKnowledge();
  const json = JSON.stringify(k);

  it("ไม่มีคำ/สัญลักษณ์ต้องห้ามในเนื้อหาที่ผู้ใช้เห็น", () => {
    for (const term of ["ขวดนม", "จุกนม", "นมผง", "👶", "🍼", "🤱"]) {
      expect(json, `พบคำต้องห้าม: ${term}`).not.toContain(term);
    }
  });

  it("ไม่มีข้อความทำนอง \"แม่กินแล้วน้ำนมดีต่อลูก\" หรือแนะนำสินค้าให้เด็กกิน", () => {
    expect(json).not.toMatch(/กิน[^\s]{0,10}แล้วน้ำนม/);
    expect(json).not.toMatch(/ให้ลูกกิน|ให้ลูกดื่ม|ป้อนลูก|สำหรับเด็กเล็ก|เหมาะสำหรับทารก/);
  });

  it("ข้อความที่ผูกกับสินค้าห้ามมีตัวเลขช่วงอายุเด็ก (ประกาศ 2567 ข้อ ๔(๔))", () => {
    for (const p of k.products) {
      const text = [p.product.name, p.product.why, p.product.detail, p.product.howto, p.amount, p.note]
        .filter(Boolean).join(" ");
      expect(text, p.product.name).not.toMatch(/\d+\s*\+|\d+\s*(เดือน|ขวบ|ปี)\s*(ขึ้นไป|\+)?\s*(สำหรับ)?เด็ก|แม่ลูก\s*\d/);
    }
  });

  it("นมแพะถูกวางกรอบเป็นเครื่องดื่มของ \"แม่\" เท่านั้น (ทั้ง R10 และ R11)", () => {
    const lact = k.products.find((p) => p.product.id === "goatmilk")!;
    expect(lact.note).toMatch(/สำหรับคุณแม่/);
    const preg = buildPregnancyKnowledge({ gestationalWeeks: 20 }).products.find((p) => p.product.id === "goatmilk")!;
    expect(preg.note).toMatch(/สำหรับคุณแม่/);
  });

  it("หน้าจอ R10/R11 ไม่มีอีโมจิทารก/ขวดนม/จุกนม", () => {
    for (const f of ["components/knowledge-lactation.tsx", "components/knowledge-pregnancy.tsx"]) {
      expect(readFile(f), f).not.toMatch(/👶|🍼|🤱|🧸/u);
    }
  });

  it("เช็กลิสต์ พ.ร.บ.นมผง ถูกบันทึกไว้ในโค้ดให้คนแก้ไขในอนาคตอ่าน", () => {
    expect(MILK_CODE_RULES.length).toBeGreaterThanOrEqual(5);
    const header = readFile("lib/calc/lactation.ts").slice(0, 3000);
    expect(header).toMatch(/พ\.ร\.บ\.?นมผง|ทารกและเด็กเล็ก/);
    expect(header).toMatch(/จำคุก/);
    // แต่ตัวกฎต้องไม่ถูกส่งลง payload (ไม่งั้นการสแกนคำต้องห้ามอ่านผลไม่ได้)
    expect(json).not.toContain(MILK_CODE_RULES[0]);
  });
});

describe("R11 — ตารางปั๊มนม + ปริมาณนมตามอายุ", () => {
  const k = buildLactationKnowledge();

  it("ตัวเลขรอบปั๊มเป็น \"ช่วงที่พบบ่อย\" ไม่ใช่เป้า และบอกระดับหลักฐานตามจริง", () => {
    expect(k.pump.points.join(" ")).toMatch(/ไม่ใช่เป้าที่ต้องทำให้ได้/);
    expect(k.pump.evidenceNote).toMatch(/Level IV|ความเห็นผู้เชี่ยวชาญ/);
    expect(k.pump.evidenceNote).toMatch(/ไม่ได้แปลว่าคุณทำผิด/);
    expect(k.pump.headline).toMatch(/ระบายน้ำนมออกให้เกลี้ยง/);
  });

  it("ไม่ใส่ตัวเลขที่ยืนยันไม่ได้ (ห้ามเว้นกลางคืนเกิน 4–5 ชม. · ปั๊มตี 2)", () => {
    const json = JSON.stringify(k.pump);
    expect(json).not.toMatch(/ห้ามเว้นเกิน|ทุก 4–5 ชั่วโมง|ตี 2 ต้องปั๊ม/);
    expect(k.pump.notInThisApp.length).toBeGreaterThanOrEqual(2);
  });

  it("หัวข้อปริมาณนมขึ้นต้นด้วยคำเตือนว่านมแม่ล้วนนับออนซ์ไม่ได้", () => {
    expect(k.volume.topWarning).toMatch(/นับออนซ์ไม่ได้/);
    expect(k.volume.daily.map((r) => r.amount).join(" ")).toMatch(/624|735|729|593/);
    expect(k.volume.colostrum[0].amount).toMatch(/2–10/);
    expect(k.volume.source).toMatch(/WHO/);
  });

  it("มีข้อมูล Kent 2013 ที่ลบความกังวล \"น้ำนมไม่พอ\" + โทนที่ไม่ทำให้รู้สึกผิด", () => {
    expect(k.volume.insight.headline).toMatch(/ไม่ได้แปลว่าน้ำนมน้อยลง/);
    expect(k.volume.noGuiltNote).toMatch(/ก็ไม่เป็นไร/);
    expect(k.volume.watchInstead.length).toBeGreaterThanOrEqual(3);
    expect(k.volume.redFlags.length).toBeGreaterThanOrEqual(3);
  });

  it("มีสัญญาณอันตรายหลังคลอด (CDC ครอบคลุมถึง 1 ปีหลังคลอด) และทุกข้อ = ไปทันที", () => {
    expect(k.postpartumDanger.signs.length).toBeGreaterThanOrEqual(5);
    for (const s of k.postpartumDanger.signs) {
      expect(s.action, s.sign).toBe(GO_NOW);
      expect(`${s.sign} ${s.detail}`).not.toMatch(/รอดูอาการ|ถ้าไม่ดีขึ้น/);
    }
    expect(k.postpartumDanger.cta.primary).toMatch(/โรงพยาบาล/);
    expect(k.postpartumDanger.cta.primary).not.toMatch(/1669/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔒 Safety Matrix + tier gate + ความเข้ากันได้ย้อนหลัง
// ═══════════════════════════════════════════════════════════════════════════

describe("🔒 Safety Matrix ยังทำงานกับชุดสินค้าของหน้าความรู้ (TC-11-06)", () => {
  it("stop.lactating (Varginaree) ถูกตัดออกจากชุดให้นม", () => {
    expect(PRODUCTS.varginaree.stop?.lactating).toBe(true);
    const ids = productsForStage("lactating", [...LACTATION_PRODUCT_IDS, "varginaree"]).map((p) => p.id);
    expect(ids).not.toContain("varginaree");
    expect(ids).toHaveLength(LACTATION_PRODUCT_IDS.length);
  });

  it("stop.pregnant (A.O.S · น้ำมะกรูด Shot · ดอกคำฝอย) ถูกตัดออกจากชุดตั้งครรภ์", () => {
    const ids = productsForStage("pregnant", ["ferty", "aos", "kaffirshot", "safflower", "goatmilk"]).map((p) => p.id);
    expect(ids).toEqual(["ferty", "goatmilk"]);
  });

  it("ชุด R11 ครบ 7 รายการตาม PRD พร้อมปริมาณที่ทีมระบุ (TC-11-03)", () => {
    const k = buildLactationKnowledge();
    expect(k.products.map((p) => p.product.id)).toEqual([
      "goatmilk", "ferty", "ferti9oil", "probiotics", "bananaflower", "ginger", "blackchickensoup",
    ]);
    const amount = (id: string) => k.products.find((p) => p.product.id === id)?.amount;
    expect(amount("ferty")).toBe("วันละ 1 ซอง");
    expect(amount("ferti9oil")).toBe("วันละ 1–2 เม็ด");
    expect(amount("probiotics")).toBe("วันละ 1 ซอง");
  });

  it("ลิงก์เมนูอาหารของ R10 กับ R11 เป็นคนละลิงก์ (TC-10-05 · TC-11-04)", () => {
    const preg = buildPregnancyKnowledge({}).fbMenuUrl;
    const lact = buildLactationKnowledge().fbMenuUrl;
    expect(preg).toContain("set=a.1370821821166202");
    expect(lact).toContain("share/p/1Bm3bDyo4X");
    expect(preg).not.toBe(lact);
  });
});

describe("R10/R11 — เส้นทางรายงานจริง", () => {
  it("stage pregnant → มีความรู้ตั้งครรภ์ · ไม่มีของให้นม", () => {
    const r = generateReport({ nickname: "A", stage: "pregnant", gestationalWeeks: 18 });
    expect(r.pregnancyKnowledge?.trimester).toBe(2);
    expect(r.pregnancyKnowledge?.products.map((p) => p.product.id)).toContain("bananaflower");
    expect(r.lactationKnowledge).toBeUndefined();
  });

  it("stage lactating → มีความรู้ให้นม · ไม่มีของตั้งครรภ์", () => {
    const r = generateReport({ nickname: "A", stage: "lactating" });
    expect(r.lactationKnowledge?.nourishment.title).toBe("อาหารบำรุงแม่หลังคลอด");
    expect(r.pregnancyKnowledge).toBeUndefined();
  });

  it("stage อื่นไม่ได้เนื้อหาชุดนี้เลย", () => {
    for (const s of ["prep", "infertility", "male"] as const) {
      const r = generateReport({ nickname: "A", stage: s, gestationalWeeks: 20 });
      expect(r.pregnancyKnowledge).toBeUndefined();
      expect(r.lactationKnowledge).toBeUndefined();
    }
  });

  it("🔒 tier gate — teaser payload ไม่มีเนื้อหาความรู้ติดไปด้วย", () => {
    const r = generateReport({ nickname: "A", stage: "pregnant", gestationalWeeks: 30 });
    const json = JSON.stringify(buildTeaser(r));
    expect(json).not.toMatch(/pregnancyKnowledge|lactationKnowledge|สัญญาณอันตราย|1669/);
  });

  it("รายงานเก่าที่ไม่มีฟิลด์ใหม่ ต้องอ่านแล้วได้ undefined ไม่ throw", () => {
    const legacy = { nickname: "เก่า", vitamins: [], cautions: [] } as unknown as Report;
    expect(legacy.pregnancyKnowledge).toBeUndefined();
    expect(legacy.lactationKnowledge?.products).toBeUndefined();
  });

  it("เนื้อหาความรู้ไม่ทำให้กติกาเดิม \"ห้ามการันตี\" หลุด", () => {
    const json = JSON.stringify(generateReport({ nickname: "A", stage: "lactating" }));
    expect(json).not.toMatch(/รักษาให้หาย|หายขาด|การันตี|ท้องแน่นอน/);
  });
});

describe("R10/R11 — plain text เท่านั้น (ห้าม markdown โผล่หน้าจอ)", () => {
  it("ไม่มี **bold** หรือลิงก์แบบ markdown ในข้อความทั้งหมด", () => {
    const payloads = [
      JSON.stringify(buildPregnancyKnowledge({ gestationalWeeks: 20 })),
      JSON.stringify(buildPregnancyKnowledge({})),
      JSON.stringify(buildLactationKnowledge()),
      JSON.stringify(TRIMESTER_DEVELOPMENT),
    ];
    for (const p of payloads) expect(p).not.toMatch(/\*\*|\[.+?\]\(.+?\)/);
  });
});

// ── Lucifer red-team 31/7 — ชุดสินค้าใน 2 ที่ต้องไม่หลุดจากกัน ──────────────────
describe("🔒 รายงานกับบล็อกความรู้ต้องแนะนำสินค้าชุดเดียวกัน (ห้ามขัดกันในหน้าเดียว)", () => {
  it("ชุดตั้งครรภ์ตรงกันทั้ง 2 ไฟล์", () => {
    expect([...STAGE_CORE_PREGNANT].sort()).toEqual([...PREGNANCY_PRODUCT_IDS].sort());
  });
  it("ชุดให้นมตรงกันทั้ง 2 ไฟล์", () => {
    expect([...STAGE_CORE_LACTATING].sort()).toEqual([...LACTATION_PRODUCT_IDS].sort());
  });
  it("แม่ตั้งครรภ์ไม่เห็นสินค้าที่สื่อว่า 'บำรุงไข่/เตรียมผนังมดลูก' ในตารางวิตามินของรายงาน", () => {
    const r = recommendVitamins({ stage: "pregnant", hasPcos: false, artPlan: "ยัง" });
    // OvaAll = "วิตามินรวมบำรุงไข่", Colla Telo = "บำรุงไข่และเตรียมผนังมดลูก"
    for (const banned of ["ovaall", "collatelo"]) {
      expect(r.primary.map((p) => p.id), banned).not.toContain(banned);
    }
  });
  it("แม่ให้นมได้ชุด 7 ตัวตาม PRD ไม่ใช่ชุดเตรียมตั้งครรภ์", () => {
    const r = recommendVitamins({ stage: "lactating", hasPcos: false, artPlan: "ยัง" });
    expect(r.primary.map((p) => p.id)).toContain("goatmilk");
    expect(r.primary.map((p) => p.id)).not.toContain("ovaall");
  });
});
