import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S } from "../theme";
import { Card, H2, H3, Body, Small, CheckRow, Progress, Notice, Btn } from "../components/ui";
import { buildRhythm, buildTasks, STAGE_LABEL } from "../rhythm";
import { todayISO, daysBetween, activeDays, streak } from "../store";
import type { Profile, DailyLogs } from "../store";

export default function Today({
  profile,
  logs,
  onToggleTask,
  onNeedInput,
}: {
  profile: Profile;
  logs: DailyLogs;
  onToggleTask: (key: string) => void;
  onNeedInput: (field: "period" | "gestational" | "weight") => void;
}) {
  const today = todayISO();
  const rhythm = useMemo(() => buildRhythm(profile), [profile]);
  const tasks = useMemo(() => buildTasks(profile), [profile]);
  const done = logs[today] || [];

  const planDay = profile.planStartedOn
    ? Math.min(90, daysBetween(profile.planStartedOn, today) + 1)
    : 1;
  const active = activeDays(logs);
  const run = streak(logs);

  const doneCount = tasks.filter((t) => done.includes(t.key)).length;
  const allDone = doneCount === tasks.length && tasks.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ marginBottom: S.md }}>
          <Small muted>{profile.stage ? STAGE_LABEL[profile.stage] : ""}</Small>
        </View>

        {/* ── การ์ดจังหวะ ── */}
        <Card tinted={rhythm.inFertileWindow ? "rose" : "teal"}>
          <H2>{rhythm.headline}</H2>
          {rhythm.sub ? (
            <View style={{ marginTop: S.xs }}>
              <Body>{rhythm.sub}</Body>
            </View>
          ) : null}

          {/* R-B1: ข้อมูลไม่พอ → บอกให้กรอก ห้ามเดาหรือโชว์ 0 */}
          {rhythm.needs ? (
            <View style={{ marginTop: S.md }}>
              <Btn label={rhythm.needs.label} onPress={() => onNeedInput(rhythm.needs!.field)} variant="ghost" />
            </View>
          ) : null}

          {/* 🔴 R-P4 — คำเตือนนี้ต้องอยู่ทุกที่ที่พูดถึงช่วงไข่ตก ห้ามตัดออก */}
          {(profile.stage === "prep" || profile.stage === "infertility") && !rhythm.needs ? (
            <Notice>⚠️ ช่วงมีโอกาสเป็นการประมาณจากรอบเดือน ใช้เพื่อวางแผนเท่านั้น — ใช้คุมกำเนิดไม่ได้</Notice>
          ) : null}
        </Card>

        {/* ── งานวันนี้ ── */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <H3>วันนี้ทำ {tasks.length} อย่าง</H3>
            <Text style={[T.small, { color: allDone ? C.tealDeep : C.muted, fontWeight: "600" }]}>
              {doneCount}/{tasks.length}
            </Text>
          </View>
          <View style={{ marginTop: S.sm }}>
            {tasks.map((t) => (
              <CheckRow
                key={t.key}
                label={t.label}
                hint={t.hint}
                checked={done.includes(t.key)}
                onToggle={() => onToggleTask(t.key)}
              />
            ))}
          </View>
          {allDone ? (
            <View style={{ marginTop: S.sm }}>
              <Small>ครบแล้ววันนี้ เก่งมากค่ะ 💛</Small>
            </View>
          ) : null}
        </Card>

        {/* ── ความคืบหน้า 90 วัน (R-B3 — ห้ามใช้คำตำหนิผู้ใช้) ── */}
        <Card>
          <H3>แผน 90 วัน</H3>
          <View style={{ marginTop: S.xs, marginBottom: S.sm }}>
            <Body muted>วันที่ {planDay} จาก 90</Body>
          </View>
          <Progress pct={(planDay / 90) * 100} />
          <View style={{ marginTop: S.md, flexDirection: "row", gap: S.xl }}>
            <View>
              <Text style={[T.h2, { color: C.tealDeep }]}>{active}</Text>
              <Small muted>วันที่บันทึกแล้ว</Small>
            </View>
            <View>
              <Text style={[T.h2, { color: C.roseDeep }]}>{run}</Text>
              <Small muted>ทำติดกัน (วัน)</Small>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: S.sm, paddingHorizontal: S.xs }}>
          <Small muted>
            ⚠️ ข้อมูลนี้เป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพเบื้องต้น ไม่แทนคำวินิจฉัยของแพทย์
          </Small>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
