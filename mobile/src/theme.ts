// CI จริงของแบรนด์ Baby & Mom — ดึงจาก docs/DESIGN.md (ชุดเดียวกับที่เว็บใช้)
// 🔴 ห้ามคิดสีเอง — ถ้าจะเพิ่มสีใหม่ต้องกลับไปดู DESIGN.md ก่อน
export const C = {
  teal: "#1BC0BA",
  tealDeep: "#159C97",
  tealSoft: "#E6F7F6",
  rose: "#F978B3",
  roseDeep: "#E14F97",
  roseSoft: "#FFE7F1",
  gold: "#D4A017",
  goldSoft: "#FBF1DA",
  ink: "#1F2937",
  muted: "#6B7280",
  line: "#E4E9EE",
  bg: "#FBFCFE",
  white: "#FFFFFF",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

// ขนาดตัวอักษรฐาน 17px ตามที่ต้นเคาะไว้ฝั่งเว็บ (อ่านง่ายสำหรับภาษาไทย)
// ภาษาไทยต้องการ line-height สูงกว่าอังกฤษเพราะมีสระบน-ล่าง
export const T = {
  h1: { fontSize: 24, fontWeight: "700" as const, lineHeight: 36 },
  h2: { fontSize: 19, fontWeight: "600" as const, lineHeight: 30 },
  h3: { fontSize: 17, fontWeight: "600" as const, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 27 },
  small: { fontSize: 14, lineHeight: 23 },
  tiny: { fontSize: 12.5, lineHeight: 20 },
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};
