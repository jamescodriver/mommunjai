// Design tokens — แนว 2D โค้งมน สบายตา (อ้างอิง FLO ตามที่ต้นสั่ง 8/8/69)
// สเปกเต็ม + เหตุผล: docs/mobile/DESIGN-MOBILE.md
// CI สีหลักยังยึด docs/DESIGN.md เหมือนเว็บ — ห้ามคิดสีแบรนด์เอง

export const C = {
  // ── CI แบรนด์ (ล็อก ห้ามแก้) ──
  teal: "#1BC0BA",
  tealDeep: "#159C97",
  tealSoft: "#E6F7F6",
  rose: "#F978B3",
  roseDeep: "#E14F97",
  roseSoft: "#FFE7F1",

  // ── พื้นผิวพาสเทล (ชั้นที่เพิ่มเพื่อลุคนุ่ม) ──
  // พื้นหลังเป็นครีมอมชมพู ไม่ใช่ขาวโพลน — ขาวล้วนกับการ์ดขาวจะแบนและแสบตา
  bg: "#FDF9FB",
  surface: "#FFFFFF",
  lavender: "#F0EDFB",
  cream: "#FFF6E9",
  mint: "#EAF8F4",

  // ── ตัวอักษร ──
  ink: "#2A2F3A",
  inkSoft: "#5A6270",
  muted: "#8A93A3",
  line: "#EFE7EC",

  // ── สถานะ ──
  gold: "#D4A017",
  danger: "#DC5A6B",
  dangerSoft: "#FDEBED",
  white: "#FFFFFF",
};

/** ความโค้ง — หัวใจของลุคนี้ FLO โค้งเยอะกว่าแอปทั่วไปมาก */
export const R = {
  card: 28,
  inner: 20,
  input: 18,
  check: 10,
  pill: 999,
};

/** เงานุ่ม ฟุ้ง ไม่คม — ห้ามใช้เงาเข้ม/ขอบคม (จะกลายเป็น Material ไม่ใช่ FLO) */
export const shadow = {
  soft: {
    shadowColor: "#B98AA5",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lifted: {
    shadowColor: "#B98AA5",
    shadowOpacity: 0.07,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};

// ตัวอักษร ≥16px ตามกฎ Healthcare (อ่านง่ายสำคัญกว่าสวยเนี้ยบ)
// ภาษาไทยต้องการ line-height สูงกว่าอังกฤษเพราะมีสระบน-ล่าง
export const T = {
  display: { fontSize: 44, fontWeight: "700" as const, lineHeight: 52 },
  h1: { fontSize: 24, fontWeight: "700" as const, lineHeight: 36 },
  h2: { fontSize: 19, fontWeight: "600" as const, lineHeight: 30 },
  h3: { fontSize: 17, fontWeight: "600" as const, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 27 },
  small: { fontSize: 14, lineHeight: 23 },
  tiny: { fontSize: 12.5, lineHeight: 20 },
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** จังหวะ micro-interaction — กดแล้วนุ่มแต่มีชีวิต */
export const MOTION = { press: 150, ease: 250 };
