import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * Пользовательское соглашение (дисклеймер об ответственности).
 * Шаблон — рекомендуется юридическая проверка перед публикацией.
 */
const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. О сервисе",
    body:
      "«Пернатые соседи» (далее — Приложение) — это платформа, которая помогает владельцам птиц находить друг друга и договариваться о взаимной передержке и присмотре за птицами. Приложение предоставляет только средство для знакомства и связи и не является стороной каких-либо договорённостей между пользователями.",
  },
  {
    title: "2. Ответственность за птиц",
    body:
      "Вся ответственность за здоровье, безопасность, кормление и содержание птицы полностью лежит на её владельце и на пользователе, который согласился присмотреть за птицей (ситтере). Пользователи самостоятельно оценивают друг друга, договариваются об условиях передержки и принимают связанные с этим риски.",
  },
  {
    title: "3. Ограничение ответственности",
    body:
      "Приложение не оказывает ветеринарных услуг и услуг передержки, не проверяет и не гарантирует квалификацию, добросовестность или условия содержания у других пользователей. Приложение не несёт ответственности за вред здоровью или гибель птицы, за качество услуг ситтера, за действия или бездействие пользователей, а также за любые прямые или косвенные убытки, возникшие в связи с использованием сервиса.",
  },
  {
    title: "4. Рекомендации для безопасности",
    body:
      "Перед передержкой рекомендуется: показать птицу ветеринару и убедиться в её здоровье; заранее письменно согласовать условия, сроки и действия в нештатных ситуациях; обменяться контактами и договориться о способе связи; передать памятку по уходу и особенностям птицы.",
  },
  {
    title: "5. Согласие",
    body:
      "Используя Приложение, вы подтверждаете, что ознакомились с настоящим соглашением, понимаете его и принимаете все связанные риски на себя. Если вы не согласны с этими условиями — не используйте Приложение.",
  },
];

export default function AgreementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Пользовательское соглашение
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Пожалуйста, внимательно прочитайте условия использования приложения
          «Пернатые соседи».
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ marginTop: 18 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.foreground }]}>{s.body}</Text>
          </View>
        ))}
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
    gap: 8,
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  backBtn: { padding: 4 },
  content: { padding: 20 },
  intro: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
});
