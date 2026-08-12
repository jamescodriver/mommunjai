// เช็กสารอาหาร — ยกมาจากเว็บ /tools/nutrients ใช้ assessNutrients ตัวเดียวกัน
import React, { useState } from "react";
import { View, Text } from "react-native";
import { C, T, S, R } from "../../theme";
import { Body, Small, CheckRow, Progress, Notice } from "../../components/ui";
import { EAT_ITEMS, AVOID_ITEMS, assessNutrients } from "@shared/calc/nutrients";

const PILLAR_LABEL: Record<string, string> = {
  egg: "คุณภาพไข่",
  uterus: "มดลูก",
  hormone: "สมดุลฮอร์โมน",
};

export default function NutrientsTool() {
  const [eaten, setEaten] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);

  const toggle = (arr: string[], set: (v: string[]) => void, k: string) =>
    set(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);

  const res = assessNutrients(eaten, avoided);
  const touched = eaten.length > 0 || avoided.length > 0;

  return (
    <View>
      <Body>วันนี้กินอะไรไปแล้วบ้าง?</Body>
      <View style={{ marginTop: S.xs }}>
        {EAT_ITEMS.map((it) => (
          <CheckRow
            key={it.key}
            label={it.label}
            hint={PILLAR_LABEL[it.pillar]}
            checked={eaten.includes(it.key)}
            onToggle={() => toggle(eaten, setEaten, it.key)}
          />
        ))}
      </View>

      <View style={{ marginTop: S.md }}>
        <Body>วันนี้เผลอกินอะไรพวกนี้ไหม?</Body>
        <View style={{ marginTop: S.xs }}>
          {AVOID_ITEMS.map((it) => (
            <CheckRow
              key={it.key}
              label={it.label}
              checked={avoided.includes(it.key)}
              onToggle={() => toggle(avoided, setAvoided, it.key)}
            />
          ))}
        </View>
      </View>

      {/* 🔴 ยังไม่ติ๊กอะไรเลย = ยังไม่ได้ประเมิน ห้ามโชว์ 0% เหมือนคะแนนสอบตก
          (กฎเดียวกับฝั่งเว็บ "ยังไม่ประเมิน ≠ 0") */}
      {touched ? (
        <View style={{ backgroundColor: C.tealSoft, borderRadius: R.inner, padding: S.md, marginTop: S.md }}>
          <Body>ทำได้ {res.eatenCount} จาก {res.totalEat} อย่าง</Body>
          <View style={{ marginTop: S.sm, gap: S.sm }}>
            {(["egg", "uterus", "hormone"] as const).map((p) => (
              <View key={p}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Small>{PILLAR_LABEL[p]}</Small>
                  <Small>{res.pillars[p]}%</Small>
                </View>
                <View style={{ marginTop: 3 }}>
                  <Progress pct={res.pillars[p]} />
                </View>
              </View>
            ))}
          </View>

          {res.missing.length ? (
            <View style={{ marginTop: S.md }}>
              <Small muted>ยังขาด: {res.missing.join(" · ")}</Small>
            </View>
          ) : null}

          {res.avoidViolations.length ? (
            <View style={{ marginTop: S.sm }}>
              <Small muted>วันนี้เผลอ: {res.avoidViolations.join(" · ")} — พรุ่งนี้ลองใหม่ได้ค่ะ</Small>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ marginTop: S.md }}>
          <Small muted>ติ๊กรายการด้านบนแล้วจะสรุปให้ทันที</Small>
        </View>
      )}

      <Notice>
        รายการนี้เป็นแนวทางทั่วไปจากคลังความรู้ของทีม Baby &amp; Mom ไม่ใช่การกำหนดอาหารเฉพาะโรค
      </Notice>
    </View>
  );
}
