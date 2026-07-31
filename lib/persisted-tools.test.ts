import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PERSISTED_TOOLS } from "./persisted-tools";

/**
 * 🔒 ด่านกัน 500 ทั้งระบบ
 *
 * `/api/lead` insert ลง tool_results โดยกรองด้วย PERSISTED_TOOLS ส่วน DB มี CHECK constraint
 * ของตัวเอง — ถ้า 2 ที่นี้ไม่ตรงกัน:
 *   • allowlist กว้างกว่า DB → insert ชน constraint → catch ด้านนอกคืน 500 → **ทุกคนส่งแบบสอบถามไม่ได้เลย**
 *   • allowlist แคบกว่า DB  → ผลเครื่องมือถูกทิ้งเงียบ ๆ ไม่มี error ให้เห็น (บั๊กที่ exercise/labs
 *     โดนมาตลอดจนเจอตอนทำ R14)
 *
 * เทสนี้อ่าน migration ล่าสุดที่แตะ constraint นี้จริง ๆ แล้วเทียบกับโค้ด
 */
describe("🔒 PERSISTED_TOOLS ต้องตรงกับ CHECK constraint ใน migration", () => {
  const dir = join(__dirname, "..", "supabase", "migrations");

  /** หา migration ไฟล์ล่าสุดที่ประกาศ tool_results_tool_check แล้วดึงรายชื่อ tool ออกมา */
  function toolsFromLatestMigration(): string[] {
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    let found: string[] | null = null;
    for (const f of files) {
      const sql = readFileSync(join(dir, f), "utf8");
      // จับเฉพาะ statement ที่ "เพิ่ม" constraint (ไม่ใช่ drop) ทั้งแบบ add constraint และแบบใน create table
      const m = sql.match(/tool_results_tool_check[\s\S]*?check\s*\(\s*tool\s+in\s*\(([^)]*)\)/i)
        || sql.match(/tool\s+text\s+not null\s+check\s*\(\s*tool\s+in\s*\(([^)]*)\)/i);
      if (m) found = m[1].split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
    }
    return found ?? [];
  }

  it("อ่าน constraint จาก migration ได้จริง (ถ้าเทสนี้ล้ม แปลว่า regex ตามไฟล์ไม่ทัน ไม่ใช่ว่าปลอดภัย)", () => {
    expect(toolsFromLatestMigration().length).toBeGreaterThan(0);
  });

  it("รายชื่อใน allowlist กับใน DB ตรงกันเป๊ะ ไม่มีตัวไหนเกินหรือขาด", () => {
    const db = toolsFromLatestMigration();
    expect([...PERSISTED_TOOLS].sort()).toEqual([...db].sort());
  });

  it("ครอบคลุมเครื่องมือที่มีหน้าจริงใน app/tools/ ครบทุกตัว", () => {
    // เครื่องมือที่มีหน้าแต่ไม่อยู่ในลิสต์ = ผลผู้ใช้หายเงียบ ๆ แบบที่ exercise/labs เคยโดน
    const toolPages = readdirSync(join(__dirname, "..", "app", "tools"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const t of toolPages) {
      expect(PERSISTED_TOOLS, `เครื่องมือ /tools/${t} ไม่อยู่ใน PERSISTED_TOOLS`).toContain(t);
    }
  });
});
