"use client";
import { useState } from "react";
import { useEmbed } from "@/components/use-embed";
import { EAT_ITEMS, AVOID_ITEMS, assessNutrients } from "@/lib/calc/nutrients";
import { recordTool } from "@/lib/profile-store";
import { ToolShell, ResultCard, PlanCta, EmbedAutoResize } from "@/components/ui";

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><span>{pct}%</span></div>
      <div className="mt-1 h-2 rounded-full bg-black/5">
        <div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NutrientsPage() {
  const embed = useEmbed();
  const [eaten, setEaten] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [res, setRes] = useState<ReturnType<typeof assessNutrients> | null>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, k: string) =>
    set(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);

  const run = () => {
    const r = assessNutrients(eaten, avoided);
    setRes(r);
    recordTool("nutrients", { eaten, avoided }, r);
  };

  return (
    <>
      {embed && <EmbedAutoResize />}
      <ToolShell embed={embed} emoji="🥗" title="เช็กสารอาหารวันนี้"
        intro="ติ๊กสิ่งที่กินวันนี้ แล้วดูว่าครบตามคัมภีร์ครูก้อย (บำรุงไข่ · ผนังมดลูก · ฮอร์โมน) ไหม">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">✅ วันนี้กินอะไรบ้าง</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EAT_ITEMS.map((it) => (
                <label key={it.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${eaten.includes(it.key) ? "border-teal bg-teal/10" : "border-black/10 bg-white/60"}`}>
                  <input type="checkbox" className="accent-teal" checked={eaten.includes(it.key)} onChange={() => toggle(eaten, setEaten, it.key)} />
                  {it.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">⛔ วันนี้เผลอกินของต้องงดไหม</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVOID_ITEMS.map((a) => (
                <label key={a.key} className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm cursor-pointer ${avoided.includes(a.key) ? "border-rose-deep bg-rose-soft" : "border-black/10 bg-white/60"}`}>
                  <input type="checkbox" className="accent-rose-deep" checked={avoided.includes(a.key)} onChange={() => toggle(avoided, setAvoided, a.key)} />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={run}>ดูผลสรุป</button>
        </div>

        {res && (
          <ResultCard>
            <p className="text-center text-sm text-ink/60">ความครบถ้วนวันนี้</p>
            <p className="text-center text-2xl font-semibold text-teal-deep">{res.overall}%</p>
            <div className="mt-4 space-y-3">
              <Bar label="🥚 คุณภาพไข่" pct={res.pillars.egg} />
              <Bar label="🏠 ผนังมดลูก" pct={res.pillars.uterus} />
              <Bar label="⚖️ สมดุลฮอร์โมน" pct={res.pillars.hormone} />
            </div>
            {res.missing.length > 0 && (
              <p className="mt-3 text-xs text-ink/70">ยังขาด: {res.missing.join(" · ")} — เติมจากอาหารก่อน แล้วค่อยเสริมผงผัก/วิตามิน</p>
            )}
            {res.avoidViolations.length > 0 && (
              <p className="mt-2 text-xs text-rose-deep">ควรเลี่ยง: {res.avoidViolations.join(" · ")}</p>
            )}
            <PlanCta />
          </ResultCard>
        )}
      </ToolShell>
    </>
  );
}
