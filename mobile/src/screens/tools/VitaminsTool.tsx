// แนะนำวิตามิน — ยกมาจากเว็บ /tools/vitamins ใช้ recommendVitamins ตัวเดียวกัน
//
// 🔴 Safety Matrix บังคับใช้ผ่าน allowedIn() ที่อยู่ใน recommendVitamins แล้ว
//    ห้ามเขียน logic กรองสินค้าเองซ้ำในนี้เด็ดขาด (จะหลุดจากกันเมื่ออัปเดตข้างเดียว)
// 🔴 การ์ดสินค้าแสดงเฉพาะ ชื่อ · วิธีทาน · ประโยชน์ · คำเตือน — ไม่โชว์ราคา
//    (ราคาเป็นเรื่องที่ต้องคุยกับทีมใน LINE OA พร้อมบริบทของแต่ละคน)
import React, { useState } from "react";
import { View, Text } from "react-native";
import { C, T, S, R } from "../../theme";
import { Body, Small, Notice, Tappable, CheckRow } from "../../components/ui";
import {
  recommendVitamins, PCOS_STATUS_VALUES,
  type PcosStatus,
} from "@shared/calc/vitamins";
import type { Profile } from "../../store";

const PCOS_LABEL: Record<string, string> = {
  yes: "มีภาวะ PCOS",
  no: "ไม่มี",
  unsure: "ไม่แน่ใจ",
};

export default function VitaminsTool({ profile }: { profile: Profile }) {
  const [pcos, setPcos] = useState<PcosStatus>("no");
  const stage = profile.stage || "prep";

  // 🔴 คำถาม PCOS ถามเฉพาะกลุ่มที่เกี่ยวข้อง — คนท้อง/ให้นม/ฝ่ายชาย ไม่ต้องถาม
  //    (ตรงกับที่แก้ไปแล้วฝั่งเว็บ PDF-11/PDF-17)
  const askPcos = stage === "prep" || stage === "infertility";

  const res = recommendVitamins({
    stage,
    hasPcos: pcos === "yes",
    pcosStatus: askPcos ? pcos : "no",
    artPlan: "ยัง",
  });

  return (
    <View>
      {askPcos ? (
        <View>
          <Body>มีภาวะ PCOS (ถุงน้ำรังไข่) ไหมคะ?</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: S.sm }}>
            {PCOS_STATUS_VALUES.map((v) => {
              const on = pcos === v;
              return (
                <Tappable
                  key={v}
                  onPress={() => setPcos(v)}
                  accessibilityLabel={PCOS_LABEL[v]}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill,
                    borderWidth: 1.5, borderColor: on ? C.teal : C.line,
                    backgroundColor: on ? C.tealSoft : C.surface,
                    minHeight: 44, justifyContent: "center",
                  }}
                >
                  <Text style={[T.small, { color: on ? C.tealDeep : C.inkSoft, fontWeight: on ? "600" : "400" }]}>
                    {PCOS_LABEL[v]}
                  </Text>
                </Tappable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: askPcos ? S.md : 0 }}>
        <Body>แนะนำสำหรับช่วงของคุณ</Body>
        <View style={{ marginTop: S.sm }}>
          {res.primary.map((p) => (
            <View key={p.id} style={{ backgroundColor: C.bg, borderRadius: R.inner, padding: S.md, marginBottom: S.sm }}>
              <Body>{p.name}</Body>
              {p.why ? <Small muted>{p.why}</Small> : null}
              {p.howto ? (
                <View style={{ marginTop: S.xs }}>
                  <Small><Text style={{ fontWeight: "600" }}>วิธีทาน: </Text>{p.howto}</Small>
                </View>
              ) : null}
              {/* คำเตือนความปลอดภัยรายตัว — ห้ามตัดออก */}
              {p.caution ? (
                <View style={{ marginTop: S.xs, backgroundColor: C.cream, borderRadius: 12, padding: S.sm }}>
                  <Small>{p.caution}</Small>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* คำเตือนรวมจาก Safety Matrix (เช่น หยุดเมื่อไหร่) */}
      {res.cautions.length ? (
        <View style={{ marginTop: S.sm }}>
          {res.cautions.map((c) => <Notice key={c}>{c}</Notice>)}
        </View>
      ) : null}

      <View style={{ marginTop: S.sm }}>
        <Small muted>{res.note}</Small>
      </View>

      <Notice>
        รายการนี้เป็นคำแนะนำทั่วไปตามช่วงชีวิต ไม่ใช่การวินิจฉัย —
        ถ้ามีโรคประจำตัวหรือใช้ยาอยู่ ปรึกษาแพทย์/เภสัชกรก่อนเริ่มทุกครั้ง
      </Notice>
    </View>
  );
}
