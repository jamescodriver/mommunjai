import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S, R } from "../theme";
import { Card, H2, H3, Body, Small, Notice, Tappable, IconBubble } from "../components/ui";
import { IconCycle, IconDrop, IconLeaf, IconScale, IconMoon, IconChevron, IconSalad, IconRun, IconPill, IconClipboard, IconHeart } from "../components/icons";
import DateField from "../components/DateField";
import NutrientsTool from "./tools/NutrientsTool";
import ExerciseTool from "./tools/ExerciseTool";
import VitaminsTool from "./tools/VitaminsTool";
import LabsTool from "./tools/LabsTool";
import StressTool from "./tools/StressTool";
import type { Profile } from "../store";

// ใช้เครื่องคำนวณชุดเดียวกับเว็บทั้งหมด (ผ่าน alias @shared → <repo>/lib)
import { calcWater } from "@shared/calc/water";
import { calcProtein } from "@shared/calc/protein";
import { calcOvulation } from "@shared/calc/ovulation";
import { bmiScale } from "@shared/calc/bmi";
import { bedtimesForWake } from "@shared/calc/sleep";

type ToolKey = "ovulation" | "water" | "protein" | "nutrients" | "bmi" | "sleep" | "exercise" | "vitamins" | "labs" | "stress";

type Tint = "teal" | "rose" | "lavender" | "cream" | "mint";
const TOOLS: {
  key: ToolKey; title: string; desc: string; tint: Tint;
  Icon: (p: { size?: number; color?: string }) => JSX.Element; iconColor: string;
}[] = [
  { key: "ovulation", title: "นับวันไข่ตก", desc: "หาช่วงวันมีโอกาสจากรอบเดือน", tint: "rose", Icon: IconCycle, iconColor: C.roseDeep },
  { key: "water", title: "เช็คปริมาณน้ำ", desc: "ควรดื่มน้ำวันละเท่าไหร่", tint: "teal", Icon: IconDrop, iconColor: C.tealDeep },
  { key: "protein", title: "คำนวณโปรตีน", desc: "โปรตีนต่อวันเพื่อบำรุงไข่", tint: "mint", Icon: IconLeaf, iconColor: C.tealDeep },
  { key: "nutrients", title: "เช็กสารอาหาร", desc: "วันนี้กินครบตามหลักโภชนาการไหม", tint: "mint", Icon: IconSalad, iconColor: C.tealDeep },
  { key: "sleep", title: "คำนวณการนอน", desc: "ควรเข้านอนกี่โมงถึงตื่นทัน", tint: "lavender", Icon: IconMoon, iconColor: "#6E5FA8" },
  { key: "exercise", title: "แนะนำการออกกำลังกาย", desc: "โปรแกรมที่เหมาะกับช่วงของคุณ", tint: "cream", Icon: IconRun, iconColor: C.gold },
  { key: "vitamins", title: "แนะนำวิตามิน", desc: "เลือกวิตามินให้ตรงกับคุณ", tint: "rose", Icon: IconPill, iconColor: C.roseDeep },
  { key: "bmi", title: "ค่า BMI", desc: "น้ำหนักอยู่ในเกณฑ์ไหน", tint: "cream", Icon: IconScale, iconColor: C.gold },
  { key: "labs", title: "ตรวจร่างกาย ควรตรวจอะไรบ้าง", desc: "ความรู้ฮอร์โมน/ค่าน้ำเชื้อ", tint: "lavender", Icon: IconClipboard, iconColor: "#6E5FA8" },
  { key: "stress", title: "แบบประเมินความเครียด", desc: "5 ข้อสั้น ๆ จากกรมสุขภาพจิต (ST-5)", tint: "teal", Icon: IconHeart, iconColor: C.tealDeep },
];

export default function Tools({ profile, onSaveProfile }: { profile: Profile; onSaveProfile: (p: Partial<Profile>) => void }) {
  const [open, setOpen] = useState<ToolKey | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ marginBottom: S.md }}>
          <H2>เครื่องมือ</H2>
          <Small muted>ใช้ฟรี ไม่ต้องสมัคร · กรอกครั้งเดียวใช้ได้ทุกเครื่องมือ</Small>
        </View>

        {TOOLS.map((t) => {
          const isOpen = open === t.key;
          return (
            <Card key={t.key}>
              <Tappable
                onPress={() => setOpen(isOpen ? null : t.key)}
                accessibilityLabel={t.title}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: S.md, minHeight: 48 }}>
                  <IconBubble tint={t.tint}>
                    <t.Icon size={24} color={t.iconColor} />
                  </IconBubble>
                  <View style={{ flex: 1 }}>
                    <H3>{t.title}</H3>
                    <Small muted>{t.desc}</Small>
                  </View>
                  <IconChevron size={20} color={C.muted} open={isOpen} />
                </View>
              </Tappable>

              {isOpen ? (
                <View style={{ marginTop: S.md, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md }}>
                  {t.key === "water" && <WaterTool profile={profile} onSaveProfile={onSaveProfile} />}
                  {t.key === "protein" && <ProteinTool profile={profile} onSaveProfile={onSaveProfile} />}
                  {t.key === "ovulation" && <OvulationTool profile={profile} onSaveProfile={onSaveProfile} />}
                  {t.key === "bmi" && <BmiTool profile={profile} onSaveProfile={onSaveProfile} />}
                  {t.key === "sleep" && <SleepTool />}
                  {t.key === "nutrients" && <NutrientsTool />}
                  {t.key === "exercise" && <ExerciseTool profile={profile} />}
                  {t.key === "vitamins" && <VitaminsTool profile={profile} />}
                  {t.key === "labs" && <LabsTool profile={profile} />}
                  {t.key === "stress" && <StressTool />}
                </View>
              ) : null}
            </Card>
          );
        })}

        <Notice>
          ข้อมูลทั้งหมดเป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพ ไม่ใช่การวินิจฉัยหรือรักษาโรค
          และไม่แทนคำวินิจฉัยของแพทย์
        </Notice>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ช่องกรอกตัวเลข ───────────────────────────────────────────────────────────
function NumField({
  label, value, onChange, placeholder, suffix,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <View style={{ marginBottom: S.md }}>
      <Small muted>{label}</Small>
      <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType="numeric"
          style={s.input}
          placeholderTextColor={C.muted}
        />
        {suffix ? <Small muted>{suffix}</Small> : null}
      </View>
    </View>
  );
}

function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View style={{ marginBottom: S.md }}>
      <Small muted>{label}</Small>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        autoCapitalize="none"
        style={s.input}
        placeholderTextColor={C.muted}
      />
    </View>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.tealSoft, borderRadius: R.inner, padding: S.md, marginTop: S.xs }}>{children}</View>
  );
}

/** จำค่าที่กรอกให้เองเมื่อค่านั้นใช้ได้จริง (R-C2 กรอกครั้งเดียวใช้ได้ทุกเครื่องมือ)
 *  เดิมต้องกดปุ่ม "บันทึก" เอง ซึ่งเป็นขั้นตอนที่ไม่จำเป็นและถ้าลืมกด
 *  หน้า "วันนี้" จะยังบอกว่าไม่มีข้อมูลทั้งที่ผู้ใช้กรอกไปแล้ว (เจอตอนเทสต์จริง 8/8)
 *  เทียบค่าเดิมก่อนเขียนเสมอ กัน setState วนไม่จบ */
function useAutoSave(
  patch: Partial<Profile> | null,
  onSaveProfile: (p: Partial<Profile>) => void,
) {
  const last = useRef<string>("");
  useEffect(() => {
    if (!patch) return;
    const sig = JSON.stringify(patch);
    if (sig === last.current) return;
    last.current = sig;
    onSaveProfile(patch);
  }, [patch && JSON.stringify(patch)]);
}

function SavedHint() {
  return (
    <View style={{ marginTop: S.sm }}>
      <Small muted>จำค่านี้ไว้ให้แล้ว — เครื่องมืออื่นและหน้า "วันนี้" ใช้ค่านี้ได้เลย</Small>
    </View>
  );
}

// ── เครื่องมือแต่ละตัว ───────────────────────────────────────────────────────
function WaterTool({ profile, onSaveProfile }: { profile: Profile; onSaveProfile: (p: Partial<Profile>) => void }) {
  const [w, setW] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const kg = Number(w);
  const stage = profile.stage || "prep";
  const res = kg > 0 ? calcWater({ weightKg: kg, stage }) : null;
  const valid = res !== null && !("error" in res);
  useAutoSave(valid ? { weightKg: kg } : null, onSaveProfile);

  return (
    <View>
      <NumField label="น้ำหนัก" value={w} onChange={setW} placeholder="เช่น 55" suffix="กก." />
      {res && !("error" in res) ? (
        <>
          <Result>
            <Body>
              เป้าหมาย {res.targetMinMl.toLocaleString()}–{res.targetMaxMl.toLocaleString()} มล./วัน
            </Body>
            <Small muted>ประมาณ {res.glasses[0]}–{res.glasses[1]} แก้ว (แก้วละ 250 มล.)</Small>
          </Result>
          <SavedHint />
        </>
      ) : res && "error" in res ? (
        <Small muted>{res.error}</Small>
      ) : null}
    </View>
  );
}

function ProteinTool({ profile, onSaveProfile }: { profile: Profile; onSaveProfile: (p: Partial<Profile>) => void }) {
  const [w, setW] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const kg = Number(w);
  // infertility ไม่มีในสูตรโปรตีน → เทียบเป็น prep เหมือนที่เว็บทำ
  const stage = profile.stage === "infertility" ? "prep" : (profile.stage || "prep");
  const res = kg > 0 ? calcProtein({ weightKg: kg, stage }) : null;
  const valid = res !== null && !("error" in res);
  useAutoSave(valid ? { weightKg: kg } : null, onSaveProfile);

  return (
    <View>
      <NumField label="น้ำหนัก" value={w} onChange={setW} placeholder="เช่น 55" suffix="กก." />
      {res && !("error" in res) ? (
        <>
          <Result>
            <Body>เป้าหมาย {res.minGrams}–{res.maxGrams} กรัม/วัน</Body>
            <View style={{ marginTop: S.sm }}>
              {res.foodEquivalents.map((f) => (
                <Small key={f.label} muted>• {f.label} — {f.amount}</Small>
              ))}
            </View>
          </Result>
          <SavedHint />
        </>
      ) : res && "error" in res ? (
        <Small muted>{res.error}</Small>
      ) : null}
    </View>
  );
}

function OvulationTool({ profile, onSaveProfile }: { profile: Profile; onSaveProfile: (p: Partial<Profile>) => void }) {
  const [d, setD] = useState(profile.lastPeriodStart || "");
  const [c, setC] = useState(String(profile.cycleLength || 28));
  const cycle = Number(c);
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(d) && cycle > 0;
  const res = ok ? calcOvulation({ lastPeriodStart: d, cycleLength: cycle }) : null;
  const valid = res !== null && !("error" in res);
  useAutoSave(valid ? { lastPeriodStart: d, cycleLength: cycle } : null, onSaveProfile);

  return (
    <View>
      <DateField label="วันแรกของประจำเดือนล่าสุด" value={d} onChange={setD} />
      <NumField label="ความยาวรอบเดือน" value={c} onChange={setC} placeholder="28" suffix="วัน" />
      {res && !("error" in res) ? (
        <>
          <Result>
            <Body>ช่วงมีโอกาส: {res.fertileStart} ถึง {res.fertileEnd}</Body>
            <Small muted>คาดว่าไข่ตก {res.ovulationDate} · รอบถัดไป {res.nextPeriod}</Small>
            {res.irregularWarning ? (
              <View style={{ marginTop: S.sm }}>
                <Small>รอบเดือนอยู่นอกช่วงทั่วไป (21–35 วัน) — ผลอาจคลาดเคลื่อน ควรปรึกษาแพทย์</Small>
              </View>
            ) : null}
          </Result>
          {/* 🔴 R-P4 — ห้ามตัดคำเตือนนี้ออกไม่ว่ากรณีใด */}
          <Notice tone="danger">
            ⚠️ ผลนี้เป็นการประมาณจากรอบเดือน ใช้เพื่อวางแผนเท่านั้น — <Text style={{ fontWeight: "700" }}>ใช้คุมกำเนิดไม่ได้</Text>
          </Notice>
          <SavedHint />
        </>
      ) : res && "error" in res ? (
        <Small muted>{res.error}</Small>
      ) : null}
    </View>
  );
}

function BmiTool({ profile, onSaveProfile }: { profile: Profile; onSaveProfile: (p: Partial<Profile>) => void }) {
  const [w, setW] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const [h, setH] = useState(profile.heightCm ? String(profile.heightCm) : "");
  const kg = Number(w), cm = Number(h);
  const res = kg > 0 && cm > 0 ? bmiScale(kg, cm) : null;
  useAutoSave(res ? { weightKg: kg, heightCm: cm } : null, onSaveProfile);

  return (
    <View>
      <NumField label="น้ำหนัก" value={w} onChange={setW} placeholder="เช่น 55" suffix="กก." />
      <NumField label="ส่วนสูง" value={h} onChange={setH} placeholder="เช่น 160" suffix="ซม." />
      {res ? (
        <>
          <Result>
            <Body>BMI {res.bmi} — {res.label}</Body>
            <Small muted>{res.note}</Small>
          </Result>
          <Notice>ค่า BMI เป็นตัวเลขอ้างอิงคร่าว ๆ ไม่ได้บอกสุขภาพทั้งหมด และไม่ใช่การวินิจฉัย</Notice>
          <SavedHint />
        </>
      ) : null}
    </View>
  );
}

function SleepTool() {
  const [wake, setWake] = useState("06:30");
  const res = bedtimesForWake(wake);
  return (
    <View>
      <TextField label="ตื่นกี่โมง (ชช:นน)" value={wake} onChange={setWake} placeholder="06:30" />
      {"bedtimes" in res ? (
        <Result>
          <Body>ควรเข้านอนเวลา</Body>
          <View style={{ marginTop: S.xs }}>
            {res.bedtimes.map((b) => (
              <Small key={b} muted>• {b} น.</Small>
            ))}
          </View>
          <View style={{ marginTop: S.sm }}>
            <Small>เกณฑ์ที่แนะนำ: นอน 7–9 ชั่วโมง และเข้านอนก่อน 4 ทุ่ม (22:00)</Small>
          </View>
        </Result>
      ) : (
        <Small muted>{res.error}</Small>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.input,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    fontSize: 16,
    color: C.ink,
    backgroundColor: C.white,
    marginTop: 4,
    minHeight: 48,
  },
});
