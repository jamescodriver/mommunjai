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
