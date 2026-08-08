import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { C, T, S, shadow } from "../theme";

export function Card({
  children,
  style,
  tinted,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tinted?: "teal" | "rose" | "gold" | "danger";
}) {
  const bg =
    tinted === "teal" ? C.tealSoft
    : tinted === "rose" ? C.roseSoft
    : tinted === "gold" ? C.goldSoft
    : tinted === "danger" ? C.dangerSoft
    : C.white;
  return <View style={[s.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={[T.h2, { color: C.ink }]}>{children}</Text>;
}
export function H3({ children }: { children: React.ReactNode }) {
  return <Text style={[T.h3, { color: C.ink }]}>{children}</Text>;
}
export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[T.body, { color: muted ? C.muted : C.ink }]}>{children}</Text>;
}
export function Small({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[T.small, { color: muted ? C.muted : C.ink }]}>{children}</Text>;
}

export function Btn({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
}) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        isPrimary && { backgroundColor: C.teal },
        isGhost && { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.teal },
        variant === "quiet" && { backgroundColor: "transparent" },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.75 },
      ]}
    >
      <Text
        style={[
          T.body,
          { fontWeight: "600", textAlign: "center" },
          { color: isPrimary ? C.white : C.tealDeep },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CheckRow({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      // ปุ่มติ๊กต้องแตะง่ายบนมือถือ — พื้นที่แตะอย่างน้อย 44pt ตามแนวทาง accessibility
      style={({ pressed }) => [s.checkRow, pressed && { opacity: 0.6 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[s.box, checked && { backgroundColor: C.teal, borderColor: C.teal }]}>
        {checked && <Text style={s.tick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[T.body, { color: C.ink }, checked && { color: C.muted }]}>{label}</Text>
        {hint ? <Text style={[T.tiny, { color: C.muted }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Progress({ pct }: { pct: number }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <View style={s.bar}>
      <View style={[s.barFill, { width: `${w}%` }]} />
    </View>
  );
}

/** แถบเตือนความปลอดภัย — ใช้กับ disclaimer ที่ห้ามหาย (PRD R-P2/R-P4) */
export function Notice({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "danger" }) {
  return (
    <View style={[s.notice, { backgroundColor: tone === "danger" ? C.dangerSoft : C.goldSoft }]}>
      <Text style={[T.tiny, { color: C.ink }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, padding: S.lg, marginBottom: S.md, ...shadow },
  btn: { paddingVertical: 14, paddingHorizontal: S.xl, borderRadius: 999, minHeight: 48, justifyContent: "center" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: S.md, paddingVertical: 11, minHeight: 46 },
  box: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: C.teal,
    alignItems: "center", justifyContent: "center",
  },
  tick: { color: C.white, fontSize: 16, fontWeight: "700", lineHeight: 20 },
  bar: { height: 9, borderRadius: 999, backgroundColor: C.line, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: C.teal, borderRadius: 999 },
  notice: { borderRadius: 12, padding: S.md, marginTop: S.sm },
});
