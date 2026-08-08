import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S, shadow } from "../theme";
import { Body, Small, Notice } from "../components/ui";
import { STAGE_LABEL, STAGE_DESC } from "../rhythm";
import type { Stage } from "../store";

const STAGES: Stage[] = ["prep", "infertility", "pregnant", "lactating", "male"];

export default function Onboarding({ onPick }: { onPick: (s: Stage) => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ alignItems: "center", marginTop: S.lg, marginBottom: S.xl }}>
          <Text style={[T.h1, { color: C.ink, textAlign: "center" }]}>
            <Text style={{ color: C.teal }}>วิทยาศาสตร์</Text>
            ของ
            <Text style={{ color: C.rose }}>ความเป็นแม่</Text>
          </Text>
          <View style={{ marginTop: S.md }}>
            <Body muted>ตอนนี้คุณอยู่ช่วงไหนคะ?</Body>
          </View>
        </View>

        {STAGES.map((st) => (
          <Pressable
            key={st}
            onPress={() => onPick(st)}
            style={({ pressed }) => [s.opt, pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] }]}
          >
            <Text style={[T.h3, { color: C.ink }]}>{STAGE_LABEL[st]}</Text>
            <Text style={[T.small, { color: C.muted, marginTop: 2 }]}>{STAGE_DESC[st]}</Text>
          </Pressable>
        ))}

        <View style={{ marginTop: S.md }}>
          <Notice>
            ℹ️ เลือกผิดเปลี่ยนทีหลังได้ตลอด — ข้อมูลเก็บอยู่ในเครื่องคุณเท่านั้น ยังไม่ส่งออกไปไหน
          </Notice>
        </View>
        <View style={{ marginTop: S.sm }}>
          <Small muted>
            ข้อมูลในแอปนี้เป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพ ไม่ใช่การวินิจฉัยหรือรักษาโรค
            และไม่แทนคำวินิจฉัยของแพทย์
          </Small>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  opt: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
});
