// แบบประเมินความเครียด ST-5 — ยกมาจากเว็บ /tools/stress ใช้ scoreSt5 ตัวเดียวกัน
//
// 🔴 กฎความปลอดภัยที่ห้ามผิด (จาก R14 ฝั่งเว็บ · legal-compliance §4 ห้ามขายความกลัว):
//    1. คะแนนสูง → ต้องขึ้น "สายด่วน 1323" **ก่อนและเด่นกว่า** อย่างอื่นเสมอ
//    2. ห้ามใช้คะแนนความเครียดเป็นเครื่องมือขายสินค้า
//    3. ต้องเรียกว่า "แบบประเมินความเครียดทั่วไปของกรมสุขภาพจิต"
//       ห้ามเรียกว่าแบบประเมินสำหรับคนท้อง (ST-5 ไม่เคย validate ในหญิงตั้งครรภ์)
import React, { useState } from "react";
import { View, Text, Linking } from "react-native";
import { C, T, S, R } from "../../theme";
import { Body, Small, Notice, Tappable, Btn } from "../../components/ui";
import { IconChat } from "../../components/icons";
import {
  ST5_QUESTIONS, ST5_OPTIONS, ST5_TIMEFRAME, ST5_CREDIT,
  HELPLINE, STRESS_DISCLAIMER, scoreSt5,
} from "@shared/calc/stress";

export default function StressTool() {
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => ST5_QUESTIONS.map(() => null),
  );

  const pick = (qi: number, v: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === qi ? v : a)));

  const res = scoreSt5(answers);
  const answered = answers.filter((a) => a !== null).length;

  return (
    <View>
      <Small muted>{ST5_TIMEFRAME} คุณรู้สึกแบบนี้บ่อยแค่ไหน</Small>

      {ST5_QUESTIONS.map((q, qi) => (
        <View key={qi} style={{ marginTop: S.md }}>
          <Body>{qi + 1}. {q}</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: S.sm }}>
            {ST5_OPTIONS.map((o) => {
              const on = answers[qi] === o.value;
              return (
                <Tappable
                  key={o.value}
                  onPress={() => pick(qi, o.value)}
                  accessibilityLabel={`ข้อ ${qi + 1} ${o.label}`}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: R.pill, borderWidth: 1.5,
                    borderColor: on ? C.teal : C.line,
                    backgroundColor: on ? C.tealSoft : C.surface,
                    minHeight: 44, justifyContent: "center",
                  }}
                >
                  <Text style={[T.small, { color: on ? C.tealDeep : C.inkSoft, fontWeight: on ? "600" : "400" }]}>
                    {o.label}
                  </Text>
                </Tappable>
              );
            })}
          </View>
        </View>
      ))}

      {/* ตอบไม่ครบ = ยังไม่มีผล ห้ามคำนวณครึ่ง ๆ */}
      {!res ? (
        <View style={{ marginTop: S.md }}>
          <Small muted>ตอบครบ 5 ข้อแล้วจะสรุปผลให้ (ตอบแล้ว {answered}/5)</Small>
        </View>
      ) : (
        <View style={{ marginTop: S.md }}>
          <View style={{ backgroundColor: C.tealSoft, borderRadius: R.inner, padding: S.md }}>
            <Text style={[T.h1, { color: res.color }]}>{res.score}<Text style={T.body}> / 15</Text></Text>
            <Body>{res.bandLabel}</Body>
            <View style={{ marginTop: S.sm }}>
              <Small>{res.advice}</Small>
            </View>
          </View>

          {/* 🔴 สายด่วนต้องมาก่อนและเด่นกว่าทุกอย่าง เมื่อคะแนนถึงเกณฑ์ */}
          {res.showHelpline ? (
            <View style={{
              backgroundColor: C.roseSoft, borderRadius: R.inner,
              padding: S.lg, marginTop: S.md,
            }}>
              <Body>คุณไม่ต้องผ่านเรื่องนี้ไปคนเดียวนะคะ</Body>
              <View style={{ marginTop: S.xs, marginBottom: S.md }}>
                <Small>{HELPLINE.name} · {HELPLINE.note}</Small>
              </View>
              <Btn
                label={`โทร ${HELPLINE.number}`}
                icon={<IconChat size={20} color={C.white} />}
                onPress={() => Linking.openURL(`tel:${HELPLINE.number}`)}
              />
            </View>
          ) : null}
        </View>
      )}

      <Notice>{STRESS_DISCLAIMER}</Notice>
      <View style={{ marginTop: S.sm }}>
        <Small muted>{ST5_CREDIT}</Small>
      </View>
    </View>
  );
}
