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
  // U-06 (RTM 13 ส.ค. 69) — ผูกบัญชี LINE แล้วหรือยัง
  // ผูกแล้ว = เขาเดินทางมาจากแชท เห็นรหัสมาแล้ว → ไม่ต้องโชว์รหัสซ้ำ (ดู components/report-view.tsx)
  // 🔒 ถามแยกจาก reports เพราะ payload เป็น snapshot ตอนออกรหัส ไม่รู้ว่าภายหลังผูก LINE หรือยัง
  //    ผิดพลาด/ไม่พบ = ถือว่า "ยังไม่ผูก" เสมอ เพื่อให้ยังเห็นรหัสไว้ผูกได้ (fail-safe)
  let lineLinked = false;
  try {
    const { data: t } = await sb.from("tickets").select("lead_id").eq("code", code).maybeSingle();
    if (t?.lead_id) {
      const { data: lead } = await sb.from("leads").select("line_user_id").eq("id", t.lead_id).maybeSingle();
      lineLinked = !!lead?.line_user_id;
    }
  } catch {
    lineLinked = false;
  }

  return <ReportView report={data.payload as Report} code={code} lineLinked={lineLinked} />;
}
