import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S } from "../theme";
import { Card, H3, Body, Small, CheckRow, Progress, Notice, Btn, IconBubble } from "../components/ui";
import RhythmRing from "../components/RhythmRing";
import { IconSparkle } from "../components/icons";
import { buildRhythm, buildTasks, STAGE_LABEL } from "../rhythm";
import { todayISO, daysBetween, activeDays, streak } from "../store";
import type { Profile, DailyLogs } from "../store";

export default function Today({
  profile, logs, onToggleTask, onNeedInput,
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
        <View style={{ marginBottom: S.sm }}>
          <Small muted>{profile.stage ? STAGE_LABEL[profile.stage] : ""}</Small>
        </View>

        {/* ── วงแหวนจังหวะ (องค์ประกอบเอกลักษณ์) ── */}
        <View style={{ alignItems: "center", marginTop: S.sm, marginBottom: S.lg }}>
          <RhythmRing
            progress={rhythm.ring.progress}
            highlight={rhythm.ring.highlight}
            title={rhythm.headline}
            subtitle={rhythm.sub}
            active={rhythm.inFertileWindow}
          />

          {/* R-B1: ข้อมูลไม่พอ → ชวนกรอก ห้ามเดาหรือโชว์ 0 */}
          {rhythm.needs ? (
            <View style={{ marginTop: S.lg, alignSelf: "stretch", paddingHorizontal: S.xl }}>
              <Btn
                label={rhythm.needs.label}
                variant="ghost"
                onPress={() => onNeedInput(rhythm.needs!.field)}
              />
            </View>
          ) : null}
        </View>

        {/* 🔴 R-P4 — คำเตือนนี้ต้องอยู่ทุกที่ที่พูดถึงช่วงไข่ตก ห้ามตัดออก */}
        {(profile.stage === "prep" || profile.stage === "infertility") && !rhythm.needs ? (
          <View style={{ marginBottom: S.md }}>
            <Notice>
              ช่วงมีโอกาสเป็นการประมาณจากรอบเดือน ใช้เพื่อวางแผนเท่านั้น — ใช้คุมกำเนิดไม่ได้
            </Notice>
          </View>
        ) : null}

        {/* ── งานวันนี้ ── */}
        <Card lifted>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <H3>วันนี้ทำ {tasks.length} อย่าง</H3>
            <View style={{
              backgroundColor: allDone ? C.tealSoft : C.bg,
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
            }}>
              <Text style={[T.small, { color: allDone ? C.tealDeep : C.muted, fontWeight: "600" }]}>
                {doneCount}/{tasks.length}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: S.xs }}>
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
            <View style={{
              marginTop: S.sm, flexDirection: "row", alignItems: "center", gap: S.sm,
              backgroundColor: C.tealSoft, padding: S.md, borderRadius: 16,
            }}>
              <IconSparkle size={18} color={C.tealDeep} />
              <Small>ครบแล้ววันนี้ เก่งมากค่ะ</Small>
            </View>
          ) : null}
        </Card>

        {/* ── ความคืบหน้า 90 วัน (R-B3 — ห้ามใช้คำตำหนิผู้ใช้) ── */}
        <Card tint="lavender">
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
            <IconBubble tint="lavender">
              <Text style={[T.h3, { color: C.ink }]}>{planDay}</Text>
            </IconBubble>
            <View style={{ flex: 1 }}>
              <H3>แผน 90 วัน</H3>
              <Small muted>วันที่ {planDay} จาก 90</Small>
            </View>
          </View>

          <View style={{ marginTop: S.md }}>
            <Progress pct={(planDay / 90) * 100} tint={C.rose} />
          </View>

          <View style={{ marginTop: S.lg, flexDirection: "row", gap: S.xxl }}>
            <View>
              <Text style={[T.h1, { color: C.tealDeep }]}>{active}</Text>
              <Small muted>วันที่บันทึกแล้ว</Small>
            </View>
            <View>
              <Text style={[T.h1, { color: C.roseDeep }]}>{run}</Text>
              <Small muted>ทำติดกัน (วัน)</Small>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: S.xs, paddingHorizontal: S.xs }}>
          <Small muted>
            ข้อมูลนี้เป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพเบื้องต้น ไม่แทนคำวินิจฉัยของแพทย์
          </Small>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
