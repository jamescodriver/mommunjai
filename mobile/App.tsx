import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { C, T, R, shadow } from "./src/theme";
import { IconHome, IconTools, IconPlan, IconMe } from "./src/components/icons";
import {
  loadProfile, saveProfile, loadLogs, saveLogs, resetAll, todayISO,
  loadSubmission, saveSubmission,
  type Profile, type DailyLogs, type Stage, type Submission,
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
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      const [p, l, s] = await Promise.all([loadProfile(), loadLogs(), loadSubmission()]);
      setProfile(p);
      setLogs(l);
      setSubmission(s);
      setReady(true);
    })();
  }, []);

  const recordSubmission = useCallback((s: Submission) => {
    setSubmission(s);
    saveSubmission(s);
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
    setSubmission(null);
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
            tabBarStyle: {
              backgroundColor: C.surface,
              borderTopWidth: 0,
              height: 78, paddingBottom: 14, paddingTop: 10,
              // ขอบบนโค้ง + เงานุ่ม ให้แถบล่างดู "ลอย" ตามลุค FLO
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              position: "absolute",
              ...shadow.lifted,
            },
            tabBarLabelStyle: { fontSize: 11.5, lineHeight: 18, includeFontPadding: false },
            tabBarIconStyle: { marginBottom: 2 },
            // แถบล่างลอยทับเนื้อหา — เผื่อที่ให้ scroll ไม่โดนบัง
            sceneStyle: { paddingBottom: 78 },
          }}
        >
          <Tab.Screen
            name="วันนี้"
            options={{ tabBarIcon: ({ color }) => <IconHome size={25} color={color} /> }}
          >
            {() => <Today profile={profile} logs={logs} onToggleTask={toggleTask} onNeedInput={needInput} />}
          </Tab.Screen>

          <Tab.Screen
            name="เครื่องมือ"
            options={{ tabBarIcon: ({ color }) => <IconTools size={25} color={color} /> }}
          >
            {() => <Tools profile={profile} onSaveProfile={patchProfile} />}
          </Tab.Screen>

          <Tab.Screen
            name="แผนของฉัน"
            options={{ tabBarIcon: ({ color }) => <IconPlan size={25} color={color} /> }}
          >
            {() => <Plan profile={profile} logs={logs} submission={submission} onSubmitted={recordSubmission} />}
          </Tab.Screen>

          <Tab.Screen
            name="ฉัน"
            options={{ tabBarIcon: ({ color }) => <IconMe size={25} color={color} /> }}
          >
            {() => <Me profile={profile} submission={submission} onSaveProfile={patchProfile} onChangeStage={changeStage} onReset={doReset} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
