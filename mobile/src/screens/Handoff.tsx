// "ตอนจบ" ของแอป — สรุปรายงานเบื้องต้น · ออกรหัส ticket · ส่งต่อไป LINE OA
//
// นี่คือหน้าจอเดียวในแอปที่ข้อมูลออกจากเครื่องผู้ใช้ (ดูเหตุผล/กฎใน src/lead.ts)
//
// ── โครงเดียวกับหน้าปิดของเว็บ (app/plan/page.tsx §result) โดยตั้งใจ ──────────
// คนคนเดียวกันอาจกรอกจากเว็บก่อนแล้วมาเปิดแอป ถ้าสองที่พูดคนละภาษา/ให้ของคนละอย่าง
// เขาจะไม่เชื่อทั้งคู่ · ลำดับที่ห้ามสลับ:
//   รหัส → เป้าหมายต่อวัน → แนะนำเบื้องต้น → ⚠️ คำเตือน → ปุ่มไป LINE → disclaimer
//
// 🔒 คำเตือน (cautions) ต้องอยู่ **เหนือ** ปุ่มไป LINE เสมอ — กฎจาก red-team ของเว็บ
//    (31/7) teaser คือชั้นที่คนส่วนใหญ่เห็น ถ้าคำเตือนไปอยู่ใต้ปุ่ม ผู้หญิงอายุ 40+
//    จะเห็นรายการสินค้า + ปุ่มขาย โดยไม่เคยเห็นประโยค "พบแพทย์ผู้เชี่ยวชาญได้เลย"
import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Modal, Linking, ActivityIndicator, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, T, S, R, shadow } from "../theme";
import { Card, H2, H3, Body, Small, Btn, CheckRow, Notice, Tappable, IconBubble } from "../components/ui";
import { IconChat, IconSparkle, IconAlert, IconPill } from "../components/icons";
import { LINE_OA_URL } from "../config";
import { submitLead, validateContact, type ContactChannel, type LeadResult } from "../lead";
import type { Profile, Submission } from "../store";
import { CONSENT_TEXT, MEDICAL_DISCLAIMER } from "@shared/disclaimer";

const CHANNELS: { v: ContactChannel; label: string; placeholder: string }[] = [
  { v: "line", label: "LINE ID", placeholder: "เช่น babyandmom" },
  { v: "phone", label: "เบอร์โทร", placeholder: "เช่น 0812345678" },
  { v: "other", label: "อื่น ๆ", placeholder: "เช่น อีเมล" },
];

function Field({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: S.md }}>
      <Small muted>{label}</Small>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        autoCorrect={false}
        style={{
          borderWidth: 1.5, borderColor: value ? C.teal : C.line, borderRadius: R.input,
          backgroundColor: C.surface, paddingHorizontal: S.md, paddingVertical: 13,
          minHeight: 52, marginTop: 4, fontSize: 16, color: C.ink,
        }}
      />
    </View>
  );
}

/** กล่องรหัส ticket — จุดที่ผู้ใช้ต้องอ่านออกและก๊อปไปพิมพ์ใน LINE ให้ได้ */
function TicketBox({ code }: { code: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          borderWidth: 2, borderStyle: "dashed", borderColor: C.teal,
          backgroundColor: C.tealSoft, borderRadius: R.inner,
          paddingHorizontal: S.xl, paddingVertical: S.md, marginVertical: S.md,
        }}
      >
        <Text style={[T.h1, { color: C.tealDeep, letterSpacing: 2 }]}>{code}</Text>
      </View>
      {/* ใช้ Share ของระบบแทน Clipboard — ไม่ต้องเพิ่ม dependency และผู้ใช้ส่งเข้า
          แชท LINE ได้ตรง ๆ เลย ซึ่งเป็นสิ่งที่เขาต้องทำต่ออยู่แล้ว */}
      <Btn
        label="ส่ง/บันทึกรหัสนี้"
        variant="ghost"
        onPress={() => Share.share({ message: code })}
      />
    </View>
  );
}

export default function Handoff({
  profile, submission, onSubmitted, onClose,
}: {
  profile: Profile;
  submission: Submission | null;
  onSubmitted: (s: Submission) => void;
  onClose: () => void;
}) {
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [channel, setChannel] = useState<ContactChannel>("line");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [showConsentText, setShowConsentText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<LeadResult | null>(null);

  // เคยส่งไปแล้วในเครื่องนี้ → ข้ามฟอร์ม ไปหน้ารหัสเลย
  const code = result?.ticketCode || submission?.ticketCode || null;
  const teaser = result?.teaser;
  const ch = CHANNELS.find((x) => x.v === channel)!;

  const doSubmit = async () => {
    const problem = validateContact({ nickname, channel, value: contact }, consent);
    if (problem) return setErr(problem);
    setErr(null);
    setBusy(true);
    try {
      const r = await submitLead(profile, { nickname, channel, value: contact });
      setResult(r);
      onSubmitted({ ticketCode: r.ticketCode, submittedAt: new Date().toISOString() });
    } catch (e: any) {
      setErr(e?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: S.md }}>
          <H2>{code ? "เรียบร้อยแล้วค่ะ" : "รับแผนฉบับเต็ม"}</H2>
          <Tappable onPress={onClose} accessibilityLabel="ปิด" style={{ padding: S.sm, minHeight: 44, justifyContent: "center" }}>
            <Text style={[T.body, { color: C.tealDeep }]}>ปิด</Text>
          </Tappable>
        </View>

        {code ? (
          <>
            <Card tint="teal" lifted>
              <View style={{ alignItems: "center" }}>
                <IconBubble tint="rose"><IconSparkle size={22} color={C.roseDeep} /></IconBubble>
                <View style={{ marginTop: S.sm }}>
                  <Body>
                    เก็บรหัสนี้ไว้คุยต่อกับทีม Baby &amp; Mom ใน LINE OA
                    เพื่อรับแผนบำรุง 90 วันฉบับเต็มค่ะ
                  </Body>
                </View>
              </View>
              <TicketBox code={code} />
              {result?.devMode ? (
                <Small muted>
                  (โหมดทดสอบ — เซิร์ฟเวอร์ยังไม่ได้ต่อฐานข้อมูล รหัสนี้ยังใช้ใน LINE ไม่ได้)
                </Small>
              ) : null}
            </Card>

            {/* เป้าหมายต่อวันที่คำนวณจากตัวเขาเอง — พิสูจน์ว่าแผนทำให้เฉพาะบุคคลจริง
                🔒 กฎ "ยังไม่ประเมิน ≠ 0": ไม่มีแถวไหนคำนวณได้ → ไม่แสดงการ์ดนี้เลย
                   ห้ามโชว์ 0 หรือเดาค่ามาเติม */}
            {teaser?.metrics?.length ? (
              <Card>
                <H3>เป้าหมายต่อวันของคุณ</H3>
                <View style={{ marginTop: S.sm, gap: 6 }}>
                  {teaser.metrics.map((m) => (
                    <View key={m.key} style={{ flexDirection: "row", justifyContent: "space-between", gap: S.md }}>
                      <Small muted>{m.label}</Small>
                      <View style={{ flex: 1 }}>
                        <Text style={[T.small, { color: C.tealDeep, fontWeight: "600", textAlign: "right" }]}>{m.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {teaser?.recommendedProducts?.length ? (
              <Card tint="rose">
                <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
                  <IconPill size={20} color={C.roseDeep} />
                  <H3>แนะนำเบื้องต้นสำหรับคุณ</H3>
                </View>
                <View style={{ marginTop: S.sm, gap: S.sm }}>
                  {teaser.recommendedProducts.map((p) => (
                    <View key={p.id}>
                      <Text style={[T.body, { color: C.ink, fontWeight: "600" }]}>{p.name}</Text>
                      <Small muted>{p.why}</Small>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {/* 🔒 ต้องอยู่เหนือปุ่มไป LINE เสมอ — ดูคอมเมนต์หัวไฟล์ */}
            {teaser?.cautions?.length ? (
              <View style={{ backgroundColor: C.dangerSoft, borderRadius: R.inner, padding: S.md, marginBottom: S.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm, marginBottom: S.xs }}>
                  <IconAlert size={18} color={C.danger} />
                  <Text style={[T.small, { color: C.danger, fontWeight: "600" }]}>ต้องรู้ก่อนเริ่ม</Text>
                </View>
                {teaser.cautions.map((c, i) => (
                  <Small key={i} muted>• {c}</Small>
                ))}
              </View>
            ) : null}

            <Btn
              label="รับแผนฉบับเต็มผ่าน LINE OA"
              icon={<IconChat size={20} color={C.white} />}
              onPress={() => Linking.openURL(LINE_OA_URL)}
            />
            <View style={{ marginTop: S.sm }}>
              <Small muted>
                พิมพ์รหัส {code} ในแชท หรือกด “แผนของฉัน” ในเมนู LINE เพื่อรับแผนเต็มพร้อมราคา
              </Small>
            </View>

            <Notice>{MEDICAL_DISCLAIMER}</Notice>
          </>
        ) : (
          <>
            <Card tint="teal">
              <H3>จะเกิดอะไรขึ้นต่อ</H3>
              <View style={{ marginTop: S.xs, gap: 4 }}>
                <Small muted>1. เราสรุปข้อมูลที่คุณกรอกในแอปเป็นรายงานเบื้องต้น</Small>
                <Small muted>2. ออกรหัสประจำตัวให้คุณ 1 รหัส</Small>
                <Small muted>3. เอารหัสไปคุยต่อใน LINE OA เพื่อรับแผน 90 วันฉบับเต็ม</Small>
              </View>
            </Card>

            <Card>
              <Field label="ชื่อเล่นของคุณ" value={nickname} onChangeText={setNickname} placeholder="เช่น หมิว" />

              <Small muted>ให้ทีมงานติดต่อกลับทางไหนดีคะ</Small>
              <View style={{ flexDirection: "row", gap: S.sm, marginTop: S.xs, marginBottom: S.md }}>
                {CHANNELS.map((x) => {
                  const on = channel === x.v;
                  return (
                    <Tappable
                      key={x.v}
                      onPress={() => setChannel(x.v)}
                      accessibilityLabel={x.label}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill,
                        borderWidth: 1.5, borderColor: on ? C.teal : C.line,
                        backgroundColor: on ? C.tealSoft : C.surface,
                        minHeight: 44, justifyContent: "center",
                      }}
                    >
                      <Text style={[T.small, { color: on ? C.tealDeep : C.inkSoft, fontWeight: on ? "600" : "400" }]}>
                        {x.label}
                      </Text>
                    </Tappable>
                  );
                })}
              </View>

              <Field
                label={ch.label}
                value={contact}
                onChangeText={setContact}
                placeholder={ch.placeholder}
                keyboardType={channel === "phone" ? "phone-pad" : "default"}
              />
            </Card>

            {/* 🔴 PDPA ม.26 — ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ต้องยินยอมโดย "รู้ว่ายินยอมอะไร"
                จึงต้องกางข้อความเต็มให้อ่านได้จริงในแอป ไม่ใช่แค่ลิงก์ออกไปข้างนอก */}
            <Card>
              <CheckRow
                label="ยินยอมให้เก็บและใช้ข้อมูลของฉัน"
                hint="รวมถึงข้อมูลสุขภาพ เพื่อให้ทีมงานติดต่อกลับทาง LINE OA"
                checked={consent}
                onToggle={() => setConsent((v) => !v)}
              />
              <Tappable
                onPress={() => setShowConsentText((v) => !v)}
                accessibilityLabel="อ่านข้อความยินยอมฉบับเต็ม"
                style={{ paddingVertical: S.sm, minHeight: 44, justifyContent: "center" }}
              >
                <Text style={[T.small, { color: C.tealDeep }]}>
                  {showConsentText ? "ซ่อนข้อความยินยอมฉบับเต็ม" : "อ่านข้อความยินยอมฉบับเต็ม"}
                </Text>
              </Tappable>
              {showConsentText ? <Small muted>{CONSENT_TEXT}</Small> : null}
            </Card>

            {err ? (
              <View style={{ backgroundColor: C.dangerSoft, borderRadius: R.inner, padding: S.md, marginBottom: S.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
                  <IconAlert size={18} color={C.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={[T.small, { color: C.danger }]}>{err}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {busy ? (
              <View style={{ alignItems: "center", paddingVertical: S.md }}>
                <ActivityIndicator color={C.teal} />
                <Small muted>กำลังส่งข้อมูล…</Small>
              </View>
            ) : (
              <Btn label="สรุปรายงาน + รับรหัสของฉัน" onPress={doSubmit} />
            )}

            <Notice>{MEDICAL_DISCLAIMER}</Notice>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** ห่อด้วย Modal ให้เรียกจากแท็บไหนก็ได้ */
export function HandoffModal(props: React.ComponentProps<typeof Handoff> & { visible: boolean }) {
  const { visible, ...rest } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={rest.onClose}>
      <Handoff {...rest} />
    </Modal>
  );
}
