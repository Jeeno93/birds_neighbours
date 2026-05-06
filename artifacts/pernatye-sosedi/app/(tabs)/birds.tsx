import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { BirdCard } from "@/components/BirdCard";
import { useColors } from "@/hooks/useColors";

export default function BirdsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds } = useApp();

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.headerBg },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Мои птицы
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/add-bird");
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {birds.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Text style={{ fontSize: 48 }}>🦜</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.foreground,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Добавь своих птиц
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Нажми кнопку + в правом верхнем углу чтобы добавить первую птицу
            </Text>
            <View style={{ marginTop: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 32 }}>👆</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
                вот тут
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>
              {birds.length} {birds.length === 1 ? "птица" : birds.length < 5 ? "птицы" : "птиц"}
            </Text>
            {birds.map((bird) => (
              <BirdCard key={bird.id} bird={bird} />
            ))}
          </>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
  },
  section: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
