import React from "react";
import { View, Text, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S } from "../theme";
import { Card, H2, H3, Body, Small, Progress, Notice, Btn } from "../components/ui";
import { todayISO, daysBetween, activeDays } from "../store";
import type { Profile, DailyLogs } from "../store";

// ลิงก์ LINE OA เดียวกับที่เว็บใช้ (NEXT_PUBLIC_LINE_OA_URL)
const LINE_OA = "https://lin.ee/fBa4xkz";

const MILESTONES = [
  { from: 1, to: 30, title: "เดือนที่ 1 — ปรับพื้นฐาน", desc: "สร้างนิสัยเรื่องน้ำ การนอน และโปรตีนให้อยู่ตัวก่อน" },
  { from: 31, to: 60, title: "เดือนที่ 2 — บำรุงเข้มข้น", desc: "ต่อยอดจากพื้นฐานที่ทำได้แล้ว เพิ่มความสม่ำเสมอ" },
  { from: 61, to: 90, title: "เดือนที่ 3 — พร้อม", desc: "ร่างกายได้รับการบำรุงครบรอบการพัฒนาของไข่และอสุจิ" },
];

export default function Plan({ profile, logs }: { profile: Profile; logs: DailyLogs }) {
  const today = todayISO();
  const planDay = profile.planStartedOn ? Math.min(90, daysBetween(profile.planStartedOn, today) + 1) : 1;
  const active = activeDays(logs);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ marginBottom: S.md }}>
          <H2>แผนของฉัน</H2>
          <Small muted>ไข่และอสุจิใช้เวลาพัฒนาจนสมบูรณ์ขึ้นราว 90 วัน</Small>
        </View>

        <Card tinted="teal">
          <Text style={[T.h1, { color: C.tealDeep }]}>วันที่ {planDay}</Text>
          <View style={{ marginBottom: S.sm }}>
            <Body muted>จาก 90 วัน</Body>
          </View>
          <Progress pct={(planDay / 90) * 100} />
          <View style={{ marginTop: S.md }}>
            <Small>บันทึกไปแล้ว {active} วัน — ทุกวันที่ทำได้คือความคืบหน้าจริงค่ะ</Small>
          </View>
        </Card>

        {MILESTONES.map((m) => {
          const isNow = planDay >= m.from && planDay <= m.to;
          const isPast = planDay > m.to;
          return (
            <Card key={m.title} tinted={isNow ? "rose" : undefined}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
                <Text style={{ fontSize: 18 }}>{isPast ? "✅" : isNow ? "📍" : "⚪️"}</Text>
                <H3>{m.title}</H3>
              </View>
              <View style={{ marginTop: S.xs }}>
                <Small muted>{m.desc}</Small>
              </View>
              {isNow ? (
                <View style={{ marginTop: S.sm }}>
                  <Small>คุณอยู่ตรงนี้</Small>
                </View>
              ) : null}
            </Card>
          );
        })}

        {/* 🔴 แผนฉบับเต็ม (รายการวิตามิน/สินค้า) ยังต้องผ่าน LINE OA เหมือนเว็บ
            เพราะ PRD Open Question B1 ยังไม่ถูกเคาะ — เลือกทางที่ "ไม่เปลี่ยน funnel เดิม"
            ไว้ก่อน ถ้าแบรนด์เคาะเป็นทางอื่นค่อยแก้จุดนี้จุดเดียว */}
        <Card>
          <H3>อยากได้แผนฉบับเต็ม?</H3>
          <View style={{ marginTop: S.xs, marginBottom: S.md }}>
            <Small muted>
              แผนฉบับเต็ม (รายการบำรุงเฉพาะคุณ พร้อมคำเตือนความปลอดภัยรายตัว)
              ทีม Baby & Mom ส่งให้ทาง LINE OA — จะได้ตอบคำถามเฉพาะของคุณได้ด้วย
            </Small>
          </View>
          <Btn label="💬 คุยกับทีม Baby & Mom" onPress={() => Linking.openURL(LINE_OA)} />
        </Card>

        <Notice>
          ⚠️ แผนนี้เป็นคำแนะนำทั่วไปเพื่อเตรียมความพร้อม ไม่ใช่การวินิจฉัยหรือรักษาโรค
          และไม่รับประกันการตั้งครรภ์
        </Notice>
      </ScrollView>
    </SafeAreaView>
  );
}
