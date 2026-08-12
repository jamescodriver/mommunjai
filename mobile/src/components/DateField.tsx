// ช่องเลือกวันที่แบบแตะแล้วเด้งปฏิทิน — ไม่ต้องพิมพ์เอง
//
// ทำไมต้องมี: เดิมให้พิมพ์ "2026-08-01" เองซึ่งบนมือถือแย่มาก
// (พิมพ์ผิดรูปแบบง่าย · แป้นตัวเลขไม่มีขีด · ผู้ใช้กลุ่มนี้ไม่ควรต้องจำ format)
import React, { useState } from "react";
import { View, Text, Platform, Modal, Pressable, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { C, T, S, R, shadow } from "../theme";
import { Tappable, Btn, Small } from "./ui";
import { IconCycle } from "./icons";

/** yyyy-mm-dd → Date (เที่ยงวันเวลาท้องถิ่น กัน timezone ดึงวันเพี้ยน) */
function parseISO(iso?: string): Date {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** แสดงเป็นวันที่ไทยที่คนอ่านเข้าใจ (พ.ศ.) แทน yyyy-mm-dd */
export function formatThai(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${TH_MONTHS[m - 1]} ${y + 543}`;
}

export default function DateField({
  label, value, onChange, maxToday = true, hint,
}: {
  label: string;
  /** yyyy-mm-dd */
  value?: string;
  onChange: (iso: string) => void;
  /** ห้ามเลือกวันอนาคต (วันแรกของประจำเดือนต้องเป็นอดีตเสมอ) */
  maxToday?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(parseISO(value));

  const openPicker = () => {
    setTemp(parseISO(value));
    setOpen(true);
  };

  // Android: ปฏิทินเป็น dialog ของระบบ เลือกแล้วปิดเอง
  const onAndroidChange = (_e: any, d?: Date) => {
    setOpen(false);
    if (d) onChange(toISO(d));
  };

  const display = value ? formatThai(value) : "แตะเพื่อเลือกวัน";

  return (
    <View style={{ marginBottom: S.md }}>
      <Small muted>{label}</Small>

      <Tappable
        onPress={openPicker}
        accessibilityLabel={`${label} — ${value ? formatThai(value) : "ยังไม่ได้เลือก"}`}
        style={{
          borderWidth: 1.5, borderColor: value ? C.teal : C.line,
          borderRadius: R.input, backgroundColor: C.surface,
          paddingHorizontal: S.md, paddingVertical: 13, minHeight: 52,
          marginTop: 4, justifyContent: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: S.sm }}>
          <IconCycle size={20} color={value ? C.tealDeep : C.muted} />
          <Text style={[T.body, { color: value ? C.ink : C.muted, flex: 1 }]}>{display}</Text>
        </View>
      </Tappable>

      {hint ? <Small muted>{hint}</Small> : null}

      {/* Android — dialog ของระบบ */}
      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={temp}
          mode="date"
          display="calendar"
          maximumDate={maxToday ? new Date() : undefined}
          onChange={onAndroidChange}
        />
      ) : null}

      {/* iOS / web — ปฏิทินเต็มเดือนใน sheet ล่างจอ พร้อมปุ่มยืนยัน
          (iOS spinner ไม่ปิดตัวเอง ต้องมีปุ่มให้กด) */}
      {Platform.OS !== "android" ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(42,47,58,0.35)" }} onPress={() => setOpen(false)} />
          <View
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: S.lg, paddingBottom: S.xxl, ...shadow.lifted,
            }}
          >
            <Text style={[T.h3, { color: C.ink, textAlign: "center", marginBottom: S.sm }]}>{label}</Text>

            {Platform.OS === "web" ? (
              // ⚠️ DateTimePicker เป็น native module ไม่มีตัวรันบนเว็บ — จะได้ sheet ว่างเปล่า
              //    เว็บไม่ใช่เป้าหมายที่จะปล่อยจริง (แอปนี้ลง iOS/Android) แต่เราใช้เว็บเทสต์
              //    จึงใส่ช่องพิมพ์สำรองไว้ ไม่ให้เห็นเป็นจอว่างแล้วเข้าใจผิดว่าพัง
              <View style={{ paddingVertical: S.md }}>
                <Small muted>พิมพ์วันที่ (ปปปป-ดด-วว) — บนมือถือจริงจะเป็นปฏิทินให้กดเลือก</Small>
                <TextInput
                  defaultValue={toISO(temp)}
                  onChangeText={(t) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) setTemp(parseISO(t));
                  }}
                  placeholder="2026-08-01"
                  placeholderTextColor={C.muted}
                  style={{
                    borderWidth: 1.5, borderColor: C.line, borderRadius: R.input,
                    paddingHorizontal: S.md, paddingVertical: 12, fontSize: 16,
                    color: C.ink, marginTop: 6, minHeight: 48,
                  }}
                />
              </View>
            ) : (
              <DateTimePicker
                value={temp}
                mode="date"
                display="inline"
                locale="th-TH"
                maximumDate={maxToday ? new Date() : undefined}
                onChange={(_e, d) => d && setTemp(d)}
                themeVariant="light"
                accentColor={C.teal}
                style={{ alignSelf: "center" }}
              />
            )}

            <View style={{ flexDirection: "row", gap: S.md, marginTop: S.md }}>
              <View style={{ flex: 1 }}>
                <Btn label="ยกเลิก" variant="ghost" onPress={() => setOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label="เลือกวันนี้" onPress={() => { onChange(toISO(temp)); setOpen(false); }} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
