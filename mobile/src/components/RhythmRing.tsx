// วงแหวนจังหวะ — องค์ประกอบเอกลักษณ์ของหน้าแรก (อ้างอิงลุค FLO)
//
// สื่อ "จังหวะของร่างกาย" ได้ในภาพเดียว โดยไม่ต้องอ่านตัวเลข:
//   • วงจาง     = ทั้งรอบ/ทั้งช่วง
//   • โค้งเข้ม   = ส่วนที่ผ่านมาแล้ว
//   • โค้งชมพู  = ช่วงมีโอกาส (เฉพาะ stage ที่มีรอบเดือน)
//
// 🔴 ถ้าข้อมูลไม่พอ → วาดวงจางอย่างเดียว + ชวนกรอก
//    **ห้ามวาดวงเต็มหลอก ๆ หรือโชว์ 0** (กฎ R-B1 เดียวกับฝั่งเว็บ "ยังไม่ประเมิน ≠ 0")
import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { C, T, S } from "../theme";

const SIZE = 232;
const STROKE = 15;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export interface RingProps {
  /** 0–1 ความคืบหน้าโดยรวม (null = ยังไม่มีข้อมูลพอ) */
  progress: number | null;
  /** ช่วงเน้น (เช่นช่วงมีโอกาส) เป็นสัดส่วน 0–1 · null = ไม่มี */
  highlight?: { start: number; end: number } | null;
  /** ข้อความกลางวง */
  title: string;
  subtitle?: string | null;
  /** อยู่ในช่วงเน้นตอนนี้ไหม — เปลี่ยนสีตัวเลขกลางวง */
  active?: boolean;
}

export default function RhythmRing({ progress, highlight, title, subtitle, active }: RingProps) {
  const hasData = progress !== null;
  const clamped = hasData ? Math.max(0, Math.min(1, progress)) : 0;

  // ส่วนโค้งช่วงเน้น — คำนวณความยาวและจุดเริ่มเป็นสัดส่วนของเส้นรอบวง
  let hi: { dash: string; offset: number } | null = null;
  if (highlight && hasData) {
    const start = Math.max(0, Math.min(1, highlight.start));
    const end = Math.max(start, Math.min(1, highlight.end));
    const len = (end - start) * CIRC;
    hi = { dash: `${len} ${CIRC - len}`, offset: -start * CIRC };
  }

  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: SIZE }}>
      {/* หมุนทั้ง SVG ที่ View ข้างนอก ให้วงเริ่มที่ 12 นาฬิกา (SVG เริ่มที่ 3 นาฬิกาโดยปริยาย)
          ไม่ใช้ prop rotation/origin หรือ <G transform> ของ react-native-svg เพราะทั้งคู่
          ทำให้เกิด error "Invalid DOM property transform-origin" บนเว็บ
          ข้อความอยู่นอก <Svg> อยู่แล้ว จึงไม่หมุนตาม */}
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <Svg width={SIZE} height={SIZE}>
          {/* วงพื้น */}
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={C.line} strokeWidth={STROKE} fill="none"
          />

          {/* ช่วงมีโอกาส — วาดใต้เส้นความคืบหน้า */}
          {hi ? (
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke={C.roseSoft} strokeWidth={STROKE} fill="none"
              strokeDasharray={hi.dash} strokeDashoffset={hi.offset} strokeLinecap="round"
            />
          ) : null}

          {/* ความคืบหน้า */}
          {hasData ? (
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke={active ? C.rose : C.teal}
              strokeWidth={STROKE} fill="none"
              strokeDasharray={`${clamped * CIRC} ${CIRC}`}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>

      {/* ข้อความกลางวง — ซ้อนทับด้วย absolute ให้อยู่กึ่งกลางเป๊ะ */}
      <View
        style={{
          position: "absolute", alignItems: "center",
          paddingHorizontal: S.xl, width: SIZE,
        }}
        pointerEvents="none"
      >
        <Text
          style={[
            T.h2,
            { color: hasData ? C.ink : C.muted, textAlign: "center" },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[T.small, { color: active ? C.roseDeep : C.inkSoft, textAlign: "center", marginTop: 2 }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
