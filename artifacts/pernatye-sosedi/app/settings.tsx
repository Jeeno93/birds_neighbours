import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeMode, useThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: "light", label: "Светлая", icon: "sun" },
  { key: "dark", label: "Тёмная", icon: "moon" },
  { key: "system", label: "Как в системе", icon: "smartphone" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useThemeMode();

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleReset = () => {
    Alert.alert(
      "Сбросить данные",
      "Это удалит все ваши данные и вернёт приложение к начальному состоянию. Продолжить?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const items = [
    {
      icon: "user",
      title: "Редактировать профиль",
      onPress: () => router.push("/edit-profile"),
    },
    {
      icon: "bell",
      title: "Уведомления",
      onPress: () => Alert.alert("Скоро", "Push-уведомления будут в следующей версии"),
    },
    {
      icon: "shield",
      title: "Конфиденциальность",
      onPress: () => Alert.alert("Конфиденциальность", "Ваши данные хранятся только на вашем устройстве и не передаются третьим лицам."),
    },
    {
      icon: "help-circle",
      title: "Помощь и поддержка",
      onPress: () => Alert.alert("Поддержка", "Для связи с нами напишите в Telegram: @pernatye_sosedi"),
    },
    {
      icon: "info",
      title: "О приложении",
      onPress: () => Alert.alert("Пернатые соседи", "Версия 1.0 MVP\n\nПомощь птицам и их владельцам"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Настройки</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Внешний вид
        </Text>
        <View style={[styles.themeGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((opt, i) => {
            const active = mode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeRow,
                  i < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => setMode(opt.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name={opt.icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{opt.label}</Text>
                {active ? (
                  <Feather name="check" size={18} color={colors.primary} />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
          Аккаунт и данные
        </Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.row,
                i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                <Feather name={item.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.dangerBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.dangerBtnText, { color: colors.destructive }]}>
            Сбросить все данные
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  content: { padding: 16, gap: 8 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  themeGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 16,
  },
  dangerBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
