import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SIT_TYPE_SHORT, useApp } from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

export default function SitRequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sitRequests, birds, updateSitRequest } = useApp();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleMarkMatched = (id: string) => {
    if (pendingId) return;
    Alert.alert(
      "Закрыть запрос?",
      "Подтвердите, что вы нашли ситтера. Запрос исчезнет из общей карты передержек.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Да, нашёл",
          style: "default",
          onPress: async () => {
            setPendingId(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await updateSitRequest(id, { status: "matched" });
            } finally {
              setPendingId(null);
            }
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const STATUS_LABELS = { open: "Открыт", matched: "Совпадение", closed: "Закрыт" };
  const STATUS_COLORS = {
    open: colors.primary,
    matched: "#f59e0b",
    closed: colors.mutedForeground,
  };

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Мои запросы</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/new-request")}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sitRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Нет запросов
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Создайте запрос, чтобы найти кого-то, кто присмотрит за вашей птицей
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/new-request")}
            >
              <Text style={styles.emptyBtnText}>Создать запрос</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const requestBirds = item.birds
            .map((rb) => {
              const bird = birds.find((b) => b.id === rb.birdId);
              return bird ? { ...bird, needsMedication: rb.needsMedication } : null;
            })
            .filter((b): b is NonNullable<typeof b> => Boolean(b));
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.birdRow}>
                  {requestBirds.length > 0 ? (
                    requestBirds.map((b) => (
                      <BirdSpeciesIcon key={b.id} species={b.species} size={26} />
                    ))
                  ) : null}
                  <Text style={[styles.birdName, { color: colors.foreground }]}>
                    {requestBirds.length > 0
                      ? requestBirds.map((b) => b.name).join(", ")
                      : "Птицы удалены"}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  {item.status === "open" && (
                    <TouchableOpacity
                      style={[styles.editBtn, { borderColor: colors.border }]}
                      onPress={() => router.push(`/edit-request/${item.id}`)}
                      activeOpacity={0.7}
                      accessibilityLabel="Редактировать запрос"
                    >
                      <Feather name="edit-2" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_COLORS[item.status] + "20" },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                      {STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.sitTypeRow, { color: colors.primary }]}>
                {SIT_TYPE_SHORT[item.sitType]}
              </Text>
              <View style={styles.datesRow}>
                <Feather name="calendar" size={13} color={colors.mutedForeground} />
                <Text style={[styles.dates, { color: colors.mutedForeground }]}>
                  {" "}{item.dateFrom} — {item.dateTo}
                </Text>
              </View>
              <View style={styles.datesRow}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.dates, { color: colors.mutedForeground }]}>
                  {" "}{item.district}
                </Text>
              </View>
              {item.comment ? (
                <Text style={[styles.comment, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.comment}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.findBtn, { borderColor: colors.primary }]}
                onPress={() => router.push("/neighbors")}
                activeOpacity={0.8}
              >
                <Feather name="users" size={14} color={colors.primary} />
                <Text style={[styles.findBtnText, { color: colors.primary }]}>
                  Найти птичника
                </Text>
              </TouchableOpacity>
              {item.status === "open" && (
                <TouchableOpacity
                  style={[
                    styles.matchedBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: pendingId === item.id ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleMarkMatched(item.id)}
                  disabled={pendingId === item.id}
                  activeOpacity={0.85}
                >
                  <Feather name="check" size={14} color="#fff" />
                  <Text style={styles.matchedBtnText}>
                    {pendingId === item.id ? " Сохраняем…" : " Нашёл ситтера"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  birdRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" },
  birdName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sitTypeRow: { fontSize: 13, fontFamily: "Inter_500Medium" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  datesRow: { flexDirection: "row", alignItems: "center" },
  dates: { fontSize: 13, fontFamily: "Inter_400Regular" },
  comment: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  findBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
    marginTop: 4,
  },
  findBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  matchedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
    marginTop: 4,
  },
  matchedBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 32 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
