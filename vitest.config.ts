import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // ต้องตรงกับ alias ใน mobile/metro.config.js + mobile/tsconfig.json
      // เพื่อให้เทสต์โค้ดฝั่งแอปที่ใช้ตัวคำนวณชุดเดียวกับเว็บได้
      // ⚠️ ไฟล์ฝั่งแอปที่จะเทสต์ได้ต้องไม่ import อะไรจาก react-native (vitest รันบน node)
      "@shared": path.resolve(__dirname, "lib"),
    },
  },
  test: { environment: "node", include: ["**/*.test.ts"] },
});
