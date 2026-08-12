import React, { useRef } from "react";
import {
  View, Text, Pressable, StyleSheet, ViewStyle, Animated, AccessibilityInfo,
} from "react-native";
import { C, T, S, R, shadow, MOTION } from "../theme";
import { IconCheck, IconAlert } from "./icons";

// ── กดแล้วนุ่ม ───────────────────────────────────────────────────────────────
// FLO ทำให้ทุกการแตะรู้สึก "นุ่มแต่มีชีวิต" — scale ลงนิดเดียวใน 150ms
// เคารพ prefers-reduced-motion: ถ้าผู้ใช้ปิดแอนิเมชันไว้ ให้เปลี่ยนแค่ opacity
function useSoftPress() {
  const scale = useRef(new Animated.Value(1)).current;
  const reduce = useRef(false);

  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (alive) reduce.current = v; });
    return () => { alive = false; };
  }, []);

  const to = (v: number) =>
    Animated.timing(scale, {
      toValue: reduce.current ? 1 : v,
      duration: MOTION.press,
      useNativeDriver: true,
    }).start();

  return { scale, onPressIn: () => to(0.97), onPressOut: () => to(1) };
}

/** กล่องที่กดได้แล้วยุบนุ่ม — ใช้แทน Pressable ทั่วไปทุกที่ที่กดได้ */
export function Tappable({
  children, onPress, style, accessibilityLabel, accessibilityRole = "button", accessibilityState,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "checkbox";
  accessibilityState?: { checked?: boolean };
}) {
  const { scale, onPressIn, onPressOut } = useSoftPress();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [style as ViewStyle, pressed && { opacity: 0.92 }]}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ── การ์ด ────────────────────────────────────────────────────────────────────
export function Card({
  children, style, tint, lifted,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tint?: "teal" | "rose" | "cream" | "lavender" | "mint" | "danger";
  lifted?: boolean;
}) {
  const bg =
    tint === "teal" ? C.tealSoft
    : tint === "rose" ? C.roseSoft
    : tint === "cream" ? C.cream
    : tint === "lavender" ? C.lavender
    : tint === "mint" ? C.mint
    : tint === "danger" ? C.dangerSoft
    : C.surface;
  return (
    <View style={[s.card, { backgroundColor: bg }, lifted ? shadow.lifted : shadow.soft, style]}>
      {children}
    </View>
  );
}

// ── ตัวอักษร ─────────────────────────────────────────────────────────────────
export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text style={[T.h1, { color: C.ink }]}>{children}</Text>
);
export const H2 = ({ children }: { children: React.ReactNode }) => (
  <Text style={[T.h2, { color: C.ink }]}>{children}</Text>
);
export const H3 = ({ children }: { children: React.ReactNode }) => (
  <Text style={[T.h3, { color: C.ink }]}>{children}</Text>
);
export const Body = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <Text style={[T.body, { color: muted ? C.inkSoft : C.ink }]}>{children}</Text>
);
export const Small = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <Text style={[T.small, { color: muted ? C.muted : C.inkSoft }]}>{children}</Text>
);

// ── ปุ่ม ─────────────────────────────────────────────────────────────────────
export function Btn({
  label, onPress, variant = "primary", icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "quiet";
  icon?: React.ReactNode;
}) {
  const primary = variant === "primary";
  const ghost = variant === "ghost";
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        s.btn,
        primary ? { backgroundColor: C.teal, ...shadow.soft, shadowColor: C.teal, shadowOpacity: 0.22 } : {},
        ghost ? { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.teal } : {},
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: S.sm }}>
        {icon}
        <Text style={[T.body, { fontWeight: "600", color: primary ? C.white : C.tealDeep }]}>
          {label}
        </Text>
      </View>
    </Tappable>
  );
}

// ── ช่องติ๊ก ─────────────────────────────────────────────────────────────────
export function CheckRow({
  label, hint, checked, onToggle,
}: {
  label: string; hint?: string; checked: boolean; onToggle: () => void;
}) {
  return (
    <Tappable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={s.checkRow}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
        <View style={[s.box, checked && { backgroundColor: C.teal, borderColor: C.teal }]}>
          {checked ? <IconCheck size={17} color={C.white} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[T.body, { color: checked ? C.muted : C.ink }]}>{label}</Text>
          {hint ? <Text style={[T.tiny, { color: C.muted }]}>{hint}</Text> : null}
        </View>
      </View>
    </Tappable>
  );
}

// ── แถบความคืบหน้า ───────────────────────────────────────────────────────────
export function Progress({ pct, tint = C.teal }: { pct: number; tint?: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <View style={s.bar}>
      <View style={[s.barFill, { width: `${w}%`, backgroundColor: tint }]} />
    </View>
  );
}

// ── แถบเตือน ─────────────────────────────────────────────────────────────────
/** ใช้กับ disclaimer ที่ห้ามหาย (R-P2 / R-P4) */
export function Notice({
  children, tone = "cream",
}: { children: React.ReactNode; tone?: "cream" | "danger" }) {
  const danger = tone === "danger";
  return (
    <View style={[s.notice, { backgroundColor: danger ? C.dangerSoft : C.cream }]}>
      <View style={{ marginTop: 1 }}>
        <IconAlert size={16} color={danger ? C.danger : C.gold} />
      </View>
      <Text style={[T.tiny, { color: C.inkSoft, flex: 1 }]}>{children}</Text>
    </View>
  );
}

/** ไอคอนในวงกลมพาสเทล — ใช้นำหน้าการ์ดเครื่องมือ */
export function IconBubble({
  children, tint = "teal",
}: { children: React.ReactNode; tint?: "teal" | "rose" | "lavender" | "cream" | "mint" }) {
  const bg =
    tint === "rose" ? C.roseSoft
    : tint === "lavender" ? C.lavender
    : tint === "cream" ? C.cream
    : tint === "mint" ? C.mint
    : C.tealSoft;
  return <View style={[s.bubble, { backgroundColor: bg }]}>{children}</View>;
}

const s = StyleSheet.create({
  card: { borderRadius: R.card, padding: S.lg, marginBottom: S.md },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: S.xl,
    borderRadius: R.pill,
    minHeight: 52,
    justifyContent: "center",
  },
  // พื้นที่แตะ ≥44 ตามแนวทาง accessibility
  checkRow: { paddingVertical: 11, minHeight: 48, justifyContent: "center" },
  box: {
    width: 28, height: 28, borderRadius: R.check, borderWidth: 2,
    borderColor: C.teal, alignItems: "center", justifyContent: "center",
    backgroundColor: C.surface,
  },
  bar: { height: 10, borderRadius: R.pill, backgroundColor: C.line, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: R.pill },
  notice: {
    borderRadius: R.inner, padding: S.md, marginTop: S.sm,
    flexDirection: "row", gap: S.sm, alignItems: "flex-start",
  },
  bubble: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
});
