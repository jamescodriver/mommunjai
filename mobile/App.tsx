import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { C, T } from "./src/theme";
import {
  loadProfile, saveProfile, loadLogs, saveLogs, resetAll, todayISO,
  type Profile, type DailyLogs, type Stage,
} from "./src/store";
import Onboarding from "./src/screens/Onboarding";
import Today from "./src/screens/Today";
import Tools from "./src/screens/Tools";
import Plan from "./src/screens/Plan";
import Me from "./src/screens/Me";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.white, border: C.line, primary: C.teal },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>({});
  const [logs, setLogs] = useState<DailyLogs>({});

  useEffect(() => {
    (async () => {
      const [p, l] = await Promise.all([loadProfile(), loadLogs()]);
      setProfile(p);
      setLogs(l);
      setReady(true);
    })();
  }, []);

  const patchProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next); // fire-and-forget — state คือแหล่งความจริงระหว่างใช้งาน
      return next;
    });
  }, []);

  const pickStage = useCallback(async (stage: Stage) => {
    await patchProfile({ stage, planStartedOn: todayISO() });
  }, [patchProfile]);

  // เปลี่ยน stage: เริ่มนับ 90 วันใหม่ตามช่วงใหม่ แต่บันทึกรายวันเดิมไม่หาย (PRD R-D1)
  const changeStage = useCallback(async (stage: Stage) => {
    await patchProfile({ stage, planStartedOn: todayISO() });
  }, [patchProfile]);

  const toggleTask = useCallback((key: string) => {
    const d = todayISO();
    setLogs((prev) => {
      const cur = prev[d] || [];
      const next = { ...prev, [d]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] };
      saveLogs(next);
      return next;
    });
  }, []);

  const doReset = useCallback(async () => {
    await resetAll();
    setProfile({});
    setLogs({});
  }, []);

  const needInput = useCallback((field: "period" | "gestational" | "weight") => {
    const where =
      field === "period" ? "แท็บ “เครื่องมือ” → นับวันไข่ตก"
      : field === "gestational" ? "แท็บ “ฉัน” → ข้อมูลพื้นฐาน"
      : "แท็บ “ฉัน” → ข้อมูลพื้นฐาน";
    Alert.alert("กรอกเพิ่มอีกนิด", `กรอกได้ที่ ${where} ค่ะ`);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator color={C.teal} />
      </View>
    );
  }

  // ยังไม่เลือกช่วงชีวิต → เข้า onboarding ก่อน (ไม่มี login gate ตาม R-A1)
  if (!profile.stage) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Onboarding onPick={pickStage} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: C.tealDeep,
            tabBarInactiveTintColor: C.muted,
            // ภาษาไทยมีสระบน-ล่าง ต้องการความสูงมากกว่าอังกฤษ — ถ้าใช้ค่า default
            // ตัวอักษรจะโดนตัดครึ่ง (เจอตอนเทสต์จริง 8/8)
            tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 76, paddingBottom: 14, paddingTop: 8 },
            tabBarLabelStyle: { fontSize: 11.5, lineHeight: 18, includeFontPadding: false },
            tabBarIconStyle: { marginBottom: 0 },
          }}
        >
          <Tab.Screen
            name="วันนี้"
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
          >
            {() => <Today profile={profile} logs={logs} onToggleTask={toggleTask} onNeedInput={needInput} />}
          </Tab.Screen>

          <Tab.Screen
            name="เครื่องมือ"
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧮</Text> }}
          >
            {() => <Tools profile={profile} onSaveProfile={patchProfile} />}
          </Tab.Screen>

          <Tab.Screen
            name="แผนของฉัน"
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }}
          >
            {() => <Plan profile={profile} logs={logs} />}
          </Tab.Screen>

          <Tab.Screen
            name="ฉัน"
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
          >
            {() => <Me profile={profile} onSaveProfile={patchProfile} onChangeStage={changeStage} onReset={doReset} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
