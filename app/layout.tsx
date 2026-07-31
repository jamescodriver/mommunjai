import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mommunjai — เตรียมตั้งครรภ์ by Baby & Mom",
  description:
    "เครื่องมือเตรียมตั้งครรภ์: นับวันไข่ตก คำนวณโปรตีน สารอาหาร การนอน และวิตามินบำรุงตามคัมภีร์ครูก้อย",
  openGraph: {
    title: "Mommunjai — เตรียมตั้งครรภ์ by Baby & Mom",
    // 🔒 นี่คือการ์ดที่โผล่ตอนแชร์ลิงก์ใน LINE/Facebook = พื้นผิวโฆษณาโดยตรง
    // เดิมเขียน "เพิ่มโอกาสมีลูก" ซึ่งเป็นคำเคลมผลลัพธ์ที่ M1 (red-team รอบแรก) สั่งตัดไปแล้ว
    // แต่ตอนนั้น regex เทสต์จับแค่ "เพิ่มโอกาสสำเร็จ" จึงหลุดจุดนี้มาตลอด — Lucifer 31/7
    description: "บำรุงร่างกายให้พร้อมก่อนตั้งครรภ์ ด้วยความรู้ที่มีงานวิจัยรองรับ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
