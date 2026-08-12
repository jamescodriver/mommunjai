// ตรวจร่างกาย ควรตรวจอะไรบ้าง — ยกมาจากเว็บ /tools/labs ใช้ข้อมูลชุดเดียวกัน
//
// 🔴 นี่คือ "ส่วนความรู้" เท่านั้น ห้ามทำให้ดูเหมือนแปลผลเลือดให้ผู้ใช้
//    ค่าอ้างอิงต้องบอกเสมอว่าให้ยึดใบผลตรวจจริงของแล็บ ไม่ใช่ตัวเลขในแอป
import React, { useState } from "react";
import { View, Text } from "react-native";
import { C, T, S, R } from "../../theme";
import { Body, Small, Notice, Tappable } from "../../components/ui";
import { IconChevron } from "../../components/icons";
import {
  FEMALE_HORMONES, SEMEN_PARAMS, SEMEN_REFERENCE_CAVEAT,
  LAB_REFERENCE_DISCLAIMER, ENDOMETRIAL_NOTE,
} from "@shared/calc/labs";
import type { Profile } from "../../store";

type Side = "female" | "male";

export default function LabsTool({ profile }: { profile: Profile }) {
  const [side, setSide] = useState<Side>(profile.stage === "male" ? "male" : "female");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <View>
      {/* สลับฝ่ายหญิง/ฝ่ายชาย */}
      <View style={{ flexDirection: "row", gap: S.sm }}>
        {([["female", "ฝ่ายหญิง"], ["male", "ฝ่ายชาย"]] as const).map(([v, label]) => {
          const on = side === v;
          return (
            <Tappable
              key={v}
              onPress={() => { setSide(v); setOpen(null); }}
              accessibilityLabel={label}
              style={{
                flex: 1, paddingVertical: 11, borderRadius: R.pill, borderWidth: 1.5,
                borderColor: on ? C.teal : C.line,
                backgroundColor: on ? C.tealSoft : C.surface,
                minHeight: 44, justifyContent: "center", alignItems: "center",
              }}
            >
              <Text style={[T.small, { color: on ? C.tealDeep : C.inkSoft, fontWeight: on ? "600" : "400" }]}>
                {label}
              </Text>
            </Tappable>
          );
        })}
      </View>

      {side === "female" ? (
        <View style={{ marginTop: S.md }}>
          {FEMALE_HORMONES.map((h) => {
            const isOpen = open === h.id;
            return (
              <View key={h.id} style={{ marginBottom: S.sm }}>
                <Tappable
                  onPress={() => setOpen(isOpen ? null : h.id)}
                  accessibilityLabel={h.name}
                  style={{
                    backgroundColor: C.bg, borderRadius: R.inner, padding: S.md,
                    minHeight: 48, justifyContent: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
                    <View style={{ flex: 1 }}>
                      <Body>{h.name}</Body>
                      <Small muted>{h.roleLabel}</Small>
                    </View>
                    <IconChevron size={18} color={C.muted} open={isOpen} />
                  </View>
                </Tappable>

                {isOpen ? (
                  <View style={{ padding: S.md, gap: S.sm }}>
                    <Small muted>{h.whatItIs}</Small>
                    <Small><Text style={{ fontWeight: "600" }}>ตรวจเมื่อไหร่: </Text>{h.whenToTest}</Small>
                    <Small><Text style={{ fontWeight: "600" }}>ค่าอ้างอิง: </Text>{h.referenceNote}</Small>
                    {h.interpretation.map((i) => <Small key={i} muted>• {i}</Small>)}
                    {h.caveat ? <Notice>{h.caveat}</Notice> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
          <Notice>{ENDOMETRIAL_NOTE}</Notice>
        </View>
      ) : (
        <View style={{ marginTop: S.md }}>
          <Body>ค่าตรวจน้ำเชื้อ (WHO ฉบับที่ 6)</Body>
          <View style={{ marginTop: S.sm }}>
            {SEMEN_PARAMS.map((p) => (
              <View key={p.id} style={{ backgroundColor: C.bg, borderRadius: R.inner, padding: S.md, marginBottom: S.sm }}>
                <Body>{p.name}</Body>
                <Small><Text style={{ fontWeight: "600" }}>ค่าต่ำสุดอ้างอิง: </Text>{p.lowerLimit}</Small>
                <View style={{ marginTop: 3 }}>
                  <Small muted>{p.belowMeans}</Small>
                </View>
              </View>
            ))}
          </View>
          <Notice>{SEMEN_REFERENCE_CAVEAT}</Notice>
        </View>
      )}

      <Notice tone="danger">{LAB_REFERENCE_DISCLAIMER}</Notice>
    </View>
  );
}
