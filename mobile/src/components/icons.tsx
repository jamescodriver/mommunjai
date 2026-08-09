// ไอคอน SVG เส้นมน — แทน emoji ทั้งหมด
//
// 🔴 ทำไมต้องเลิกใช้ emoji (ไม่ใช่เรื่องรสนิยม):
//    1. emoji หน้าตาต่างกันทุกเครื่อง (iOS/Android/รุ่น OS) → คุมแบรนด์ไม่ได้เลย
//    2. emoji เปลี่ยนสีตามธีมไม่ได้ → ทำ active/inactive ของแท็บไม่ได้
//    3. emoji มีรายละเอียดเยอะ+สีจัด → ชนกับลุคพาสเทลสงบโดยตรง
//    (กติกาจาก /ui-ux-pro-max checklist: "No emojis as icons")
//
// สไตล์: stroke 2 · ปลายมน · ไม่มี fill · รับ prop สีได้
import React from "react";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { C } from "../theme";

export interface IconProps {
  size?: number;
  color?: string;
  /** ความหนาเส้น — ปรับให้บางลงได้เวลาไอคอนเล็ก */
  width?: number;
}

const base = (p: IconProps) => ({
  size: p.size ?? 24,
  color: p.color ?? C.inkSoft,
  width: p.width ?? 2,
});

const Wrap = ({ size, children }: { size: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

const strokeProps = (color: string, width: number) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

// ── แท็บล่าง ────────────────────────────────────────────────────────────────

/** บ้าน — แท็บ "วันนี้" */
export function IconHome(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M3.5 10.2 12 3.8l8.5 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.1A1.6 1.6 0 0 1 3.5 19z" {...strokeProps(color, width)} />
      <Path d="M9.4 20.6v-6.2h5.2v6.2" {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** เครื่องมือ (ตัวเลื่อนปรับค่า) — แท็บ "เครื่องมือ" */
export function IconTools(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Line x1="5" y1="4" x2="5" y2="20" {...strokeProps(color, width)} />
      <Line x1="12" y1="4" x2="12" y2="20" {...strokeProps(color, width)} />
      <Line x1="19" y1="4" x2="19" y2="20" {...strokeProps(color, width)} />
      <Circle cx="5" cy="9" r="2.4" {...strokeProps(color, width)} fill={C.surface} />
      <Circle cx="12" cy="15" r="2.4" {...strokeProps(color, width)} fill={C.surface} />
      <Circle cx="19" cy="8" r="2.4" {...strokeProps(color, width)} fill={C.surface} />
    </Wrap>
  );
}

/** ปฏิทินหัวใจ — แท็บ "แผนของฉัน" */
export function IconPlan(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M4.2 6.6a2 2 0 0 1 2-2h11.6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2z" {...strokeProps(color, width)} />
      <Line x1="8.2" y1="2.8" x2="8.2" y2="6.4" {...strokeProps(color, width)} />
      <Line x1="15.8" y1="2.8" x2="15.8" y2="6.4" {...strokeProps(color, width)} />
      <Path d="M12 17.4s-3.2-2-3.2-4.1a1.9 1.9 0 0 1 3.2-1.3 1.9 1.9 0 0 1 3.2 1.3c0 2.1-3.2 4.1-3.2 4.1z" {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** คน — แท็บ "ฉัน" */
export function IconMe(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Circle cx="12" cy="8.4" r="3.8" {...strokeProps(color, width)} />
      <Path d="M4.8 20.4a7.2 7.2 0 0 1 14.4 0" {...strokeProps(color, width)} />
    </Wrap>
  );
}

// ── เครื่องมือ ──────────────────────────────────────────────────────────────

/** ปฏิทินรอบเดือน */
export function IconCycle(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M20.2 12a8.2 8.2 0 1 1-2.6-6" {...strokeProps(color, width)} />
      <Path d="M20.4 3.6v4.6h-4.6" {...strokeProps(color, width)} />
      <Circle cx="12" cy="12" r="1.9" fill={color} />
    </Wrap>
  );
}

/** หยดน้ำ */
export function IconDrop(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M12 3.4c3.4 4 5.6 6.6 5.6 9.3A5.6 5.6 0 0 1 6.4 12.7c0-2.7 2.2-5.3 5.6-9.3z" {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** ใบไม้ (โปรตีน/โภชนาการ) */
export function IconLeaf(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M4.4 19.6c-1.6-6 2.4-12.2 10.4-13 2 0 3.6.4 4.8 1.2.4 6.8-3.6 13.2-11 13.2-1.6 0-3-.4-4.2-1.4z" {...strokeProps(color, width)} />
      <Path d="M11.4 12.6c-2.4 1.8-4.2 4.4-5.2 7.6" {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** มาตรวัด (BMI) — ใช้เกจแทนรูปตาชั่ง เพราะตาชั่งมีรายละเอียดเยอะ
 *  พอย่อเหลือ 24px แล้วเส้นตีกันจนอ่านไม่ออก (เจอตอนเทสต์จริง) */
export function IconScale(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      {/* ครึ่งวงกลมของเกจ */}
      <Path d="M3.6 17.4a8.4 8.4 0 1 1 16.8 0" {...strokeProps(color, width)} />
      {/* เข็มชี้ */}
      <Line x1="12" y1="17.4" x2="15.6" y2="11.6" {...strokeProps(color, width)} />
      <Circle cx="12" cy="17.4" r="1.5" fill={color} />
    </Wrap>
  );
}

/** พระจันทร์ (การนอน) */
export function IconMoon(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11z" {...strokeProps(color, width)} />
    </Wrap>
  );
}

// ── ทั่วไป ──────────────────────────────────────────────────────────────────

/** ติ๊กถูก — ใช้ในช่องติ๊ก */
export function IconCheck(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M4.8 12.6l4.6 4.6 9.8-10.4" {...strokeProps(color, width + 0.4)} />
    </Wrap>
  );
}

/** ลูกศรลง — ใช้บอกว่าการ์ดกางได้ */
export function IconChevron({ open, ...p }: IconProps & { open?: boolean }) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d={open ? "M6.4 14.6 12 9l5.6 5.6" : "M6.4 9.4 12 15l5.6-5.6"} {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** ข้อความ/แชท — ปุ่มไป LINE OA */
export function IconChat(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M20.4 11.6c0 3.9-3.8 7-8.4 7a9.7 9.7 0 0 1-2.6-.35L4.6 20l1.3-3.4a6.5 6.5 0 0 1-2.3-5c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7z" {...strokeProps(color, width)} />
    </Wrap>
  );
}

/** เครื่องหมายตกใจในวงกลม — คำเตือน */
export function IconAlert(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Circle cx="12" cy="12" r="8.6" {...strokeProps(color, width)} />
      <Line x1="12" y1="8" x2="12" y2="12.6" {...strokeProps(color, width)} />
      <Circle cx="12" cy="16" r="0.9" fill={color} />
    </Wrap>
  );
}

/** ประกายดาว — ใช้ตอนทำครบ/ให้กำลังใจ */
export function IconSparkle(p: IconProps) {
  const { size, color, width } = base(p);
  return (
    <Wrap size={size}>
      <Path d="M12 3.6l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9z" {...strokeProps(color, width)} />
    </Wrap>
  );
}
