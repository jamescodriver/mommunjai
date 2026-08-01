import { describe, expect, it } from "vitest";
import { reportFlex } from "./line";
import { generateReport, type ReportProfile } from "./report";

/**
 * การ์ด Flex ใน LINE OA = ผลลัพธ์สุขภาพที่ผู้ใช้เห็น จึงอยู่ใต้กฎเดียวกับหน้าเว็บ
 * เทสต์ชุดนี้เกิดตอนถอด "คะแนน x/100" ออกจากการ์ด (1/8/2026) เพราะรายงานฉบับเต็ม
 * เลิกใช้ระบบคะแนนไปตั้งแต่ R15 แล้ว
 */

const flat = (node: any): string[] => {
  if (!node || typeof node !== "object") return [];
  const here = typeof node.text === "string" ? [node.text] : [];
  const kids = [node.contents, node.header, node.body, node.footer]
    .flat()
    .filter(Boolean)
    .flatMap(flat);
  return [...here, ...kids];
};
const cardText = (p: ReportProfile) => {
  const card = reportFlex(generateReport(p), "MJ-TEST01");
  return [card.altText, ...flat(card.contents)].join("\n");
};

const FULL: ReportProfile = {
  nickname: "ก้อย", stage: "infertility", weightKg: 62, heightCm: 158, ageRange: "35-39",
  pcosStatus: "yes", artPlan: "IVF-ICSI", infertilityIssues: ["pcos"],
  sleepBedtime: "23:30", sleepWaketime: "06:30", exerciseFreq: "1-2",
  tools: { protein: { output: { minGrams: 74, maxGrams: 93, fertyServings: { max: 3 } } } },
};
const STAGES: ReportProfile["stage"][] = ["prep", "infertility", "pregnant", "lactating", "male"];

describe("reportFlex — การ์ดสรุปแผนใน LINE OA", () => {
  it("🔒 ไม่มีคะแนน x/100 หรือเปอร์เซ็นต์เสาใด ๆ หลงเหลือในทุก stage", () => {
    for (const stage of STAGES) {
      const t = cardText({ ...FULL, stage });
      expect(t, stage).not.toMatch(/\/100/);
      expect(t, stage).not.toMatch(/คะแนน/);
      expect(t, stage).not.toMatch(/\d+%/);
    }
  });

  it("🔒 ทุก stage ต้องมี disclaimer แพทย์เสมอ", () => {
    for (const stage of STAGES) {
      expect(cardText({ ...FULL, stage }), stage).toContain("ไม่แทนคำวินิจฉัยของแพทย์");
    }
  });

  it("🔒 ห้ามมีชื่อ/ราคาสินค้าในการ์ด — การ์ดในแชทไม่มีที่พอใส่คำเตือน Safety Matrix", () => {
    for (const stage of STAGES) {
      const t = cardText({ ...FULL, stage });
      expect(t, stage).not.toMatch(/฿|บาท/);
      for (const name of ["Ferty", "OvaAll", "PCO-VIT", "A.O.S", "Varginaree"]) {
        expect(t, `${stage} / ${name}`).not.toContain(name);
      }
    }
  });

  it("🔒 ห้ามเคลมผลลัพธ์/การันตี", () => {
    for (const stage of STAGES) {
      const t = cardText({ ...FULL, stage });
      for (const bad of ["การันตี", "รับรอง", "เพิ่มโอกาสสำเร็จ", "กินแล้วท้อง", "รักษา"]) {
        expect(t, `${stage} / ${bad}`).not.toContain(bad);
      }
    }
  });

  it("แสดงเป้าหมายที่คำนวณจากข้อมูลจริงของผู้ใช้", () => {
    const t = cardText(FULL);
    expect(t).toContain("เป้าหมายที่คำนวณจากข้อมูลของคุณ");
    expect(t).toMatch(/โปรตีน[\s\S]*74–93 ก\.\/วัน/);
    expect(t).toContain("มล./วัน");
    expect(t).toContain("ชม./คืน");
    expect(t).toContain("ก้อย");
  });

  it("🔒 'ยังไม่ประเมิน ≠ 0' — ไม่กรอกน้ำหนัก/ส่วนสูง ต้องไม่มีแถวโปรตีน-น้ำ ไม่ใช่แสดง 0", () => {
    const t = cardText({ nickname: "ฝน", stage: "prep" });
    expect(t).not.toContain("โปรตีน");
    expect(t).not.toContain("มล./วัน");
    expect(t).not.toMatch(/\b0 /);
    // แต่ยังต้องเปิดรายงานได้และมี disclaimer ครบ
    expect(t).toContain("ไม่แทนคำวินิจฉัยของแพทย์");
    expect(t).toContain("MJ-TEST01");
  });

  it("🔒 รายงานเก่าที่ snapshot ไว้ก่อน R3 (ไม่มี part1/part2) ต้องไม่พัง", () => {
    const legacy: any = generateReport(FULL);
    delete legacy.part1;
    delete legacy.part2;
    const card = reportFlex(legacy, "MJ-OLD001");
    const t = [card.altText, ...flat(card.contents)].join("\n");
    expect(t).toContain("ไม่แทนคำวินิจฉัยของแพทย์");
    expect(t).toContain("MJ-OLD001");
    // protein ระดับบนสุดยังอยู่ในรายงานเก่า จึงยังโชว์ได้
    expect(t).toContain("74–93 ก./วัน");
  });

  it("altText (ข้อความในรายการแชท/แจ้งเตือน) ต้องสื่อว่าแผนมาแล้ว ไม่ใช่ตัวเลขคะแนน", () => {
    const card = reportFlex(generateReport(FULL), "MJ-TEST01");
    expect(card.altText).toContain("ก้อย");
    expect(card.altText).toContain("MJ-TEST01");
    expect(card.altText).not.toMatch(/\/100|คะแนน/);
  });

  it("ใช้สี CI จริง (เขียว primary) ไม่ใช่ชมพูเดิมที่ไม่ได้อยู่ในไกด์", () => {
    const json = JSON.stringify(reportFlex(generateReport(FULL), "MJ-TEST01"));
    expect(json).toContain("#1BC0BA");
    expect(json).not.toContain("#C85A8A");
  });

  it("🔒 stage ให้นมบุตร — ห้ามมีคำที่ผูกสินค้ากับลูก (พ.ร.บ.นมผง ม.๑๔)", () => {
    const t = cardText({ ...FULL, stage: "lactating" });
    for (const bad of ["น้ำนม", "ทารก", "ขวดนม", "จุกนม", "ดีต่อลูก", "นมแม่"]) {
      expect(t, bad).not.toContain(bad);
    }
  });

  it("🔒 หัวเรื่องต้องตรงช่วงชีวิต — คนตั้งครรภ์/ให้นมต้องไม่ได้พาดหัว 'ก่อนมีลูก'", () => {
    expect(cardText({ ...FULL, stage: "pregnant" })).toContain("แผนดูแลครรภ์");
    expect(cardText({ ...FULL, stage: "lactating" })).toContain("ฟื้นฟูร่างกายหลังคลอด");
    for (const stage of ["pregnant", "lactating"] as const) {
      expect(cardText({ ...FULL, stage }), stage).not.toContain("ก่อนมีลูก");
    }
  });

  it("🔒 'ช่วงมีโอกาสสูง' ต้องไม่โผล่กับคนตั้งครรภ์/ให้นม แม้เคยใช้เครื่องมือนับวันไข่ตกไว้", () => {
    const ovu = { ovulation: { output: { ovulationDate: "2026-08-14", fertileStart: "2026-08-09", fertileEnd: "2026-08-15", nextPeriod: "2026-08-28" } } };
    for (const stage of ["pregnant", "lactating"] as const) {
      expect(cardText({ ...FULL, stage, tools: { ...FULL.tools, ...ovu } }), stage).not.toContain("ช่วงมีโอกาสสูง");
    }
    // แต่กลุ่มที่กำลังพยายามยังต้องเห็นตามเดิม
    for (const stage of ["prep", "infertility", "male"] as const) {
      expect(cardText({ ...FULL, stage, tools: { ...FULL.tools, ...ovu } }), stage).toContain("ช่วงมีโอกาสสูง");
    }
  });

  it("ไม่มีคำนำหน้าซ้ำ และแถวออกกำลังกายต้องสั้นพอสำหรับแชท", () => {
    const t = cardText(FULL);
    expect(t).not.toContain("เริ่มวันนี้: วันนี้:");
    const longRow = t.split("\n").find((l) => l.includes("นาที/สัปดาห์"));
    expect(longRow!.length).toBeLessThan(60);
  });
});

/**
 * คำเตือนถูกเขียนขึ้นสำหรับ "คนที่กำลังพยายามมีลูก" แต่เดิมใส่ให้ทุก stage
 * (ต้นเจอเอง 1/8/2026 ตอนไล่ดูหน้า teaser ของ "ให้นมบุตร")
 */
describe("cautions — ต้องตรงกับช่วงชีวิต และต้องไม่ลดจำนวนลง", () => {
  const gen = (stage: any, ageRange = "40+") =>
    generateReport({ nickname: "ก้อย", stage, ageRange, weightKg: 62, heightCm: 158 });

  it("🔒 คนตั้งครรภ์/ให้นม ต้องไม่เจอคำเตือนของคนที่กำลังพยายามมีลูก", () => {
    for (const stage of ["pregnant", "lactating"] as const) {
      const c = gen(stage).cautions.join("\n");
      expect(c, stage).not.toContain("ไม่รับประกันการตั้งครรภ์");
      expect(c, stage).not.toContain("ยังไม่สำเร็จ");
      expect(c, stage).not.toContain("มีบุตรยาก");
    }
  });

  it("🔒 แต่ต้องได้ referral ของตัวเองแทน — ห้ามเงียบ", () => {
    expect(gen("pregnant").cautions.join("\n")).toContain("ฝากครรภ์ตามนัด");
    expect(gen("lactating").cautions.join("\n")).toContain("พบแพทย์ทันที");
  });

  it("🔒 กลุ่มที่กำลังพยายามมีลูก ยังได้ referral ตามอายุเหมือนเดิม (กฎ red-team H2)", () => {
    expect(gen("prep", "40+").cautions.join("\n")).toContain("ไม่ต้องรอให้ครบกำหนด");
    expect(gen("prep", "35–39").cautions.join("\n")).toContain("6 เดือน");
    expect(gen("prep", "ต่ำกว่า 30").cautions.join("\n")).toContain("12 เดือน");
  });

  it("จำนวนคำเตือนของกลุ่มตั้งครรภ์/ให้นม ต้องไม่น้อยกว่ากลุ่มเตรียมตั้งครรภ์", () => {
    const base = gen("prep").cautions.length;
    for (const stage of ["pregnant", "lactating"] as const) {
      expect(gen(stage).cautions.length, stage).toBeGreaterThanOrEqual(base - 1);
    }
  });
});
