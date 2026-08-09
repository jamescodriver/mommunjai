import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TextInput, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S, R, shadow } from "../theme";
import { Card, H2, H3, Body, Small, Notice, Btn, Tappable } from "../components/ui";
import { IconChat } from "../components/icons";
import { STAGE_LABEL, STAGE_DESC } from "../rhythm";
import type { Profile, Stage } from "../store";

const STAGES: Stage[] = ["prep", "infertility", "pregnant", "lactating", "male"];

export default function Me({
  profile,
  onSaveProfile,
  onChangeStage,
  onReset,
}: {
  profile: Profile;
  onSaveProfile: (p: Partial<Profile>) => void;
  onChangeStage: (s: Stage) => void;
  onReset: () => void;
}) {
  const [editingStage, setEditingStage] = useState(false);
  const [w, setW] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const [h, setH] = useState(profile.heightCm ? String(profile.heightCm) : "");
  const [gw, setGw] = useState(profile.gestationalWeeks ? String(profile.gestationalWeeks) : "");

  const confirmReset = () => {
    Alert.alert(
      "ลบข้อมูลทั้งหมด?",
      "ข้อมูลทุกอย่างในเครื่องจะถูกลบถาวร — รวมบันทึกรายวันและความคืบหน้าที่ทำมา ย้อนกลับไม่ได้",
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ลบข้อมูล", style: "destructive", onPress: onReset },
      ],
    );
  };

  const confirmStage = (next: Stage) => {
    if (next === profile.stage) { setEditingStage(false); return; }
    // 🔴 เปลี่ยน stage กระทบคำแนะนำ/สินค้าที่ต้องหยุด (Safety Matrix) — ต้องยืนยันก่อนเสมอ
    Alert.alert(
      `เปลี่ยนเป็น "${STAGE_LABEL[next]}"?`,
      "คำแนะนำและเป้าหมายรายวันจะถูกคำนวณใหม่ให้ตรงกับช่วงใหม่ของคุณ · บันทึกเดิมไม่หาย",
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "เปลี่ยนเลย", onPress: () => { onChangeStage(next); setEditingStage(false); } },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ marginBottom: S.md }}>
          <H2>ฉัน</H2>
        </View>

        {/* ── ช่วงชีวิต ── */}
        <Card>
          <H3>ช่วงของคุณตอนนี้</H3>
          <View style={{ marginTop: S.xs, marginBottom: S.md }}>
            <Body>{profile.stage ? STAGE_LABEL[profile.stage] : "ยังไม่ได้เลือก"}</Body>
            {profile.stage ? <Small muted>{STAGE_DESC[profile.stage]}</Small> : null}
          </View>

          {!editingStage ? (
            <Btn label="เปลี่ยนช่วงชีวิต" variant="ghost" onPress={() => setEditingStage(true)} />
          ) : (
            <View>
              {STAGES.map((st) => (
                <Tappable
                  key={st}
                  onPress={() => confirmStage(st)}
                  accessibilityLabel={STAGE_LABEL[st]}
                  style={[
                    s.stageOpt,
                    st === profile.stage ? { borderColor: C.teal, backgroundColor: C.tealSoft } : {},
                  ]}
                >
                  <Body>{STAGE_LABEL[st]}</Body>
                  {st === profile.stage ? <Small muted>ตอนนี้</Small> : null}
                </Tappable>
              ))}
              <View style={{ marginTop: S.sm }}>
                <Btn label="ยกเลิก" variant="quiet" onPress={() => setEditingStage(false)} />
              </View>
            </View>
          )}
        </Card>

        {/* ── ข้อมูลพื้นฐาน ── */}
        <Card>
          <H3>ข้อมูลพื้นฐาน</H3>
          <View style={{ marginTop: S.sm }}>
            <Small muted>น้ำหนัก (กก.)</Small>
            <TextInput value={w} onChangeText={setW} keyboardType="numeric" style={s.input} placeholder="เช่น 55" placeholderTextColor={C.muted} />
            <Small muted>ส่วนสูง (ซม.)</Small>
            <TextInput value={h} onChangeText={setH} keyboardType="numeric" style={s.input} placeholder="เช่น 160" placeholderTextColor={C.muted} />
            {profile.stage === "pregnant" ? (
              <>
                <Small muted>อายุครรภ์ (สัปดาห์)</Small>
                <TextInput value={gw} onChangeText={setGw} keyboardType="numeric" style={s.input} placeholder="เช่น 18" placeholderTextColor={C.muted} />
              </>
            ) : null}
          </View>
          <View style={{ marginTop: S.md }}>
            <Btn
              label="บันทึก"
              onPress={() => {
                const patch: Partial<Profile> = {};
                if (Number(w) > 0) patch.weightKg = Number(w);
                if (Number(h) > 0) patch.heightCm = Number(h);
                if (profile.stage === "pregnant" && Number(gw) > 0) {
                  patch.gestationalWeeks = Number(gw);
                  patch.gestationalSetOn = new Date().toISOString().slice(0, 10);
                }
                onSaveProfile(patch);
                Alert.alert("บันทึกแล้ว", "เป้าหมายรายวันของคุณถูกคำนวณใหม่แล้วค่ะ");
              }}
            />
          </View>
        </Card>

        {/* ── ความเป็นส่วนตัว ── */}
        <Card>
          <H3>ข้อมูลของคุณ</H3>
          <View style={{ marginTop: S.xs, marginBottom: S.md }}>
            <Small muted>
              รุ่นทดลองนี้เก็บข้อมูลไว้ในเครื่องคุณเท่านั้น ยังไม่ส่งขึ้นเซิร์ฟเวอร์
              และยังไม่มีการเชื่อมบัญชีใด ๆ
            </Small>
          </View>
          <Btn label="ลบข้อมูลทั้งหมด" variant="ghost" onPress={confirmReset} />
        </Card>

        <Card>
          <H3>ติดต่อทีม</H3>
          <View style={{ marginTop: S.xs, marginBottom: S.md }}>
            <Small muted>มีคำถามเรื่องแผนของคุณ ทักทีม Baby & Mom ได้เลย</Small>
          </View>
          <Btn icon={<IconChat size={20} color={C.tealDeep} />} label="เปิด LINE OA" variant="ghost" onPress={() => Linking.openURL("https://lin.ee/fBa4xkz")} />
        </Card>

        <Notice>
          ข้อมูลในแอปเป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพ ไม่แทนคำวินิจฉัยของแพทย์
        </Notice>
        <View style={{ marginTop: S.md, alignItems: "center" }}>
          <Small muted>Mommunjai · รุ่นทดลอง (ยังไม่ปล่อยขึ้นร้าน)</Small>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.input,
    paddingHorizontal: S.md, paddingVertical: 12, fontSize: 16,
    color: C.ink, backgroundColor: C.white, marginTop: 4, marginBottom: S.md, minHeight: 48,
  },
  stageOpt: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: R.input,
    padding: S.md, marginBottom: S.sm, minHeight: 48, justifyContent: "center",
  },
});
