// แนะนำการออกกำลังกาย — ยกมาจากเว็บ /tools/exercise ใช้ recommendExercise ตัวเดียวกัน
//
// 🔴 คนท้องต้องคัดกรองภาวะห้ามออกกำลังกายก่อนเสมอ (SOGC/CSEP contraindication list)
//    ถ้าติ๊กภาวะเด็ดขาด → ต้องขึ้น "หยุด ปรึกษาแพทย์" แทนโปรแกรม ห้ามแสดงโปรแกรมคู่กัน
import React, { useState } from "react";
import { View, Text } from "react-native";
import { C, T, S, R } from "../../theme";
import { Body, Small, Notice, Tappable, CheckRow } from "../../components/ui";
import {
  recommendExercise, ABSOLUTE_CONTRAINDICATIONS, RELATIVE_CONTRAINDICATIONS,
  type BaselineActivity, type ExerciseStage,
} from "@shared/calc/exercise";
import type { Profile } from "../../store";

// ค่าตรงกับ BaselineActivity ของ lib/calc/exercise.ts เป๊ะ (มีแค่ 2 ค่า)
// ห้ามเพิ่มค่าเองในนี้ ถ้าจะเพิ่มระดับต้องไปแก้ที่ calc ซึ่งเว็บใช้ร่วมกัน
const BASELINES: { v: BaselineActivity; label: string }[] = [
  { v: "sedentary", label: "ยังไม่ค่อยได้ขยับ" },
  { v: "active", label: "ออกกำลังกายอยู่แล้ว" },
];

export default function ExerciseTool({ profile }: { profile: Profile }) {
  const [baseline, setBaseline] = useState<BaselineActivity>("sedentary");
  const [contra, setContra] = useState<string[]>([]);

  const stage = (profile.stage || "prep") as ExerciseStage;
  const isPregnant = stage === "pregnant";
  const res = recommendExercise({ stage, baseline, contraindications: isPregnant ? contra : undefined });

  const toggle = (k: string) =>
    setContra((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const stopped = res.cautionLevel === "stop";

  return (
    <View>
      <Body>ตอนนี้คุณขยับร่างกายระดับไหน?</Body>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: S.sm }}>
        {BASELINES.map((b) => {
          const on = baseline === b.v;
          return (
            <Tappable
              key={b.v}
              onPress={() => setBaseline(b.v)}
              accessibilityLabel={b.label}
              style={{
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill,
                borderWidth: 1.5, borderColor: on ? C.teal : C.line,
                backgroundColor: on ? C.tealSoft : C.surface,
                minHeight: 44, justifyContent: "center",
              }}
            >
              <Text style={[T.small, { color: on ? C.tealDeep : C.inkSoft, fontWeight: on ? "600" : "400" }]}>
                {b.label}
              </Text>
            </Tappable>
          );
        })}
      </View>

      {/* คัดกรองเฉพาะคนท้อง */}
      {isPregnant ? (
        <View style={{ marginTop: S.md }}>
          <Body>มีภาวะเหล่านี้ไหมคะ?</Body>
          <View style={{ marginTop: S.xs }}>
            {[...ABSOLUTE_CONTRAINDICATIONS, ...RELATIVE_CONTRAINDICATIONS].map((c) => (
              <CheckRow
                key={c.v}
                label={c.label}
                checked={contra.includes(c.v)}
                onToggle={() => toggle(c.v)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* 🔴 ภาวะเด็ดขาด → แสดงคำเตือนแทนโปรแกรม ห้ามโชว์คู่กัน */}
      {stopped ? (
        <View style={{ backgroundColor: C.dangerSoft, borderRadius: R.inner, padding: S.md, marginTop: S.md }}>
          <Body>{res.cautionNote}</Body>
        </View>
      ) : (
        <View style={{ backgroundColor: C.tealSoft, borderRadius: R.inner, padding: S.md, marginTop: S.md }}>
          {res.cautionNote ? (
            <View style={{ marginBottom: S.sm }}>
              <Small>{res.cautionNote}</Small>
            </View>
          ) : null}

          <Body>เป้าหมาย: {res.weeklyTarget}</Body>
          <View style={{ marginTop: S.sm, gap: 3 }}>
            <Small muted>ความถี่: {res.frequency}</Small>
            <Small muted>ระดับ: {res.intensity}</Small>
          </View>

          <View style={{ marginTop: S.md }}>
            {res.type.map((t) => <Small key={t} muted>• {t}</Small>)}
          </View>

          {res.tips.length ? (
            <View style={{ marginTop: S.md }}>
              {res.tips.map((t) => <Small key={t} muted>• {t}</Small>)}
            </View>
          ) : null}

          {res.avoid?.length ? (
            <View style={{ marginTop: S.md }}>
              <Small>ควรเลี่ยง</Small>
              {res.avoid.map((a) => <Small key={a} muted>• {a}</Small>)}
            </View>
          ) : null}

          {res.warningSigns?.length ? (
            <View style={{ marginTop: S.md }}>
              <Small>หยุดทันทีถ้ามีอาการเหล่านี้</Small>
              {res.warningSigns.map((w) => <Small key={w} muted>• {w}</Small>)}
            </View>
          ) : null}
        </View>
      )}

      {res.evidenceNote ? <Notice>{res.evidenceNote}</Notice> : null}
      <View style={{ marginTop: S.sm }}>
        <Small muted>อ้างอิง: {res.sources.join(" · ")}</Small>
      </View>
    </View>
  );
}
