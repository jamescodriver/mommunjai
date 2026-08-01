import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Baby & Mom real CI (from brand guideline + website mockups — docs/BRAND.md, DESIGN.md §9)
        teal: { DEFAULT: "#1BC0BA", deep: "#159C97", soft: "#E6F7F6" }, // PRIMARY (brand green)
        rose: { DEFAULT: "#F978B3", deep: "#E14F97", soft: "#FFE7F1" }, // SECONDARY (brand pink)
        cream: "#FFF8FB",
        gold: "#E7B84B",
        ink: "#3D3D4D",
        // 5 sub-brand stage themes (website stage cards)
        stage: {
          prime: "#5FC9A6", // เตรียมพร้อมก่อนมีลูก (mint)
          ferti: "#7C5CBF", // เพิ่มโอกาสตั้งครรภ์ (purple)
          preg: "#5FA9DE", // บำรุงแม่-ลูกในครรภ์ (blue)
          revive: "#F49B7E", // ฟื้นฟูหลังคลอด (peach)
          bloom: "#F3C64B", // ดูแลลูกน้อย (yellow)
        },
      },
      fontFamily: {
        sans: ["Prompt", "Noto Sans Thai", "system-ui", "sans-serif"],
        display: ["Poppins", "Prompt", "system-ui", "sans-serif"], // EN headings/stats
      },
      // ── Type scale สำหรับภาษาไทย ────────────────────────────────────────
      // ค่ามาตรฐานของ Tailwind ออกแบบมาสำหรับอักษรละติน (xs = 12px/16px = 1.33)
      // ภาษาไทยมีสระบน + วรรณยุกต์ + สระล่าง ซ้อนได้ถึง 3 ชั้น ระยะบรรทัด 1.33
      // ทำให้วรรณยุกต์บรรทัดล่างไปชนสระล่างของบรรทัดบน → ล้าตาและอ่านช้า
      // จึงยกขนาดขึ้นเล็กน้อยและเพิ่มระยะบรรทัดเป็น 1.75–1.85 ทั้งระบบ
      // (แก้ที่เดียว มีผลทุกหน้า — อย่าไปไล่ใส่ leading-* รายจุด)
      // ตั้งแต่ lg ขึ้นไปคงค่าเดิม เพราะเป็นหัวข้อ ไม่ใช่ข้อความยาว
      fontSize: {
        xs: ["0.85rem", { lineHeight: "1.75" }], // 13.6px (เดิม 12px)
        sm: ["0.97rem", { lineHeight: "1.8" }], //  15.5px (เดิม 14px)
        base: ["1.06rem", { lineHeight: "1.85" }], // 17px  (เดิม 16px)
      },
      boxShadow: {
        glass: "0 8px 30px rgba(20,120,110,.12)",
      },
      backdropBlur: { xs: "2px" },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
