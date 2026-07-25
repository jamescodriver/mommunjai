import Link from "next/link";
import { getServiceClient, hasSupabaseEnv } from "@/lib/supabase-server";
import ReportView from "@/components/report-view";
import type { Report } from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Shareable personalized report. The ticket code is the secret; no login needed.
export default async function ReportPage({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();

  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <div className="glass p-6">
          <p>ยังไม่ได้ตั้งค่าฐานข้อมูล — เปิดรายงานฉบับเต็มได้เมื่อระบบพร้อมใช้งานจริง</p>
          <Link href="/" className="btn-ghost mt-4">กลับหน้าหลัก</Link>
        </div>
      </main>
    );
  }

  const sb = getServiceClient();
  const { data } = await sb.from("reports").select("payload").eq("code", code).single();
  if (!data?.payload) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <div className="glass p-6">
          <p>ไม่พบรายงานสำหรับรหัสนี้ 😢</p>
          <Link href="/plan" className="btn-primary mt-4">ทำแบบสอบถามเพื่อรับแผนของคุณ</Link>
        </div>
      </main>
    );
  }
  return <ReportView report={data.payload as Report} code={code} />;
}
