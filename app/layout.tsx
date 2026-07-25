import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mommunjai — เตรียมตั้งครรภ์ by ครูก้อย",
  description:
    "เครื่องมือเตรียมตั้งครรภ์: นับวันไข่ตก คำนวณโปรตีน สารอาหาร การนอน และวิตามินบำรุงตามคัมภีร์ครูก้อย",
  openGraph: {
    title: "Mommunjai — เตรียมตั้งครรภ์ by ครูก้อย",
    description: "บำรุงร่างกายให้พร้อม เพิ่มโอกาสมีลูก ด้วยความรู้ที่มีวิทย์รองรับ",
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
