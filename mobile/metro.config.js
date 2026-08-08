// Metro config — ให้แอปมือถือใช้ "โค้ดคำนวณชุดเดียวกับเว็บ" ตรง ๆ ไม่ copy มาไว้ในนี้
//
// 🔴 เหตุผลที่ต้องทำแบบนี้ (ไม่ใช่ copy ไฟล์มา):
//    Safety Matrix (allowedIn() ใน lib/calc/vitamins.ts) คือกฎว่าสินค้าไหนห้ามใช้ช่วงไหน
//    ถ้าแยกเป็น 2 ชุดแล้ววันหนึ่งอัปเดตฝั่งเว็บอย่างเดียว แอปจะยังแนะนำของที่ควรหยุดไปแล้ว
//    = ความเสี่ยงด้านความปลอดภัยโดยตรง ไม่ใช่แค่โค้ดซ้ำ
//
//    เทสต์ 340 ตัวที่มีอยู่จึงคุ้มโค้ดชุดนี้ให้ทั้งเว็บและแอปพร้อมกัน
//
// PRD Open Question A2 (โครง repo) ยังไม่ถูกเคาะ — วิธีนี้เลือกไว้เพราะ "ย้อนกลับได้ง่ายที่สุด":
// ถ้าทีมเคาะเป็น monorepo จริงทีหลัง ย้ายแค่ path ไม่ต้องรื้อโค้ด
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// ให้ Metro เฝ้าดูโฟลเดอร์ lib/ ที่ root ของ repo ด้วย (ไม่งั้นแก้แล้วแอปไม่รู้)
config.watchFolders = [path.resolve(repoRoot, "lib")];

// หา node_modules ได้ทั้งของแอปเองและของ repo หลัก
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(repoRoot, "node_modules"),
];

// alias "@shared/..." → <repo>/lib/... (เว็บใช้ "@/lib/..." ผ่าน tsconfig ของ Next)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@shared": path.resolve(repoRoot, "lib"),
};

module.exports = config;
