import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SIT_TYPE_SHORT, SitType, User, useApp } from "@/context/AppContext";
import { NeighborCard } from "@/components/NeighborCard";
import { useColors } from "@/hooks/useColors";

const SIT_TYPE_FILTERS: SitType[] = ["full", "guest", "medical_only"];

function isCompatible(
  user: User,
  ctx: { sitType: SitType | null; needsMedication: boolean }
): boolean {
  const caps = user.capabilities ?? [];
  if (ctx.needsMedication && !caps.includes("can_medicate")) return false;
  if (ctx.sitType === "full" && !caps.includes("can_host")) return false;
  if (ctx.sitType === "guest" && !caps.includes("can_visit")) return false;
  return true;
}

export default function NeighborsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { neighbors, sitRequests } = useApp();

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "experience">("rating");
  const [sitTypeFilter, setSitTypeFilter] = useState<SitType | null>(null);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const activeRequest = sitRequests
    .filter((r) => r.status === "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const matchCtx = activeRequest
    ? {
        sitType: activeRequest.sitType,
        needsMedication: activeRequest.birds.some((b) => b.needsMedication),
      }
    : { sitType: sitTypeFilter, needsMedication: false };

  const filtered = neighbors
    .filter((n) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        n.name.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q);
      const matchesSitType =
        !sitTypeFilter || (n.sitTypes ?? []).includes(sitTypeFilter);
      return matchesQuery && matchesSitType;
    })
    .map((n) => ({ user: n, compatible: isCompatible(n, matchCtx) }))
    .sort((a, b) => {
      if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
      return sortBy === "rating"
        ? b.user.rating - a.user.rating
        : b.user.experienceYears - a.user.experienceYears;
    });

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Птичники рядом</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Поиск по имени или району..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setSortBy(sortBy === "rating" ? "experience" : "rating")}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sortRow, { borderBottomColor: colors.border }]}>
        {(["rating", "experience"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.sortChip,
              { backgroundColor: sortBy === s ? colors.primary : "transparent" },
            ]}
            onPress={() => setSortBy(s)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: sortBy === s ? "#fff" : colors.mutedForeground },
              ]}
            >
              {s === "rating" ? "По рейтингу" : "По опыту"}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {filtered.length} птичников
        </Text>
      </View>

      <View style={[styles.sitTypeRow, { borderBottomColor: colors.border, backgroundColor: colors.headerBg }]}>
        <TouchableOpacity
          style={[
            styles.sitTypeFilterChip,
            {
              backgroundColor: sitTypeFilter === null ? colors.primary : colors.card,
              borderColor: sitTypeFilter === null ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSitTypeFilter(null)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.sitTypeFilterText,
              { color: sitTypeFilter === null ? "#fff" : colors.foreground },
            ]}
          >
            Все
          </Text>
        </TouchableOpacity>
        {SIT_TYPE_FILTERS.map((t) => {
          const active = sitTypeFilter === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.sitTypeFilterChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSitTypeFilter(active ? null : t)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sitTypeFilterText,
                  { color: active ? "#fff" : colors.foreground },
                ]}
              >
                {SIT_TYPE_SHORT[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.user.id}
        renderItem={({ item }) => (
          <NeighborCard user={item.user} mayNotMatch={!item.compatible} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Птичники не найдены
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  backBtn: { padding: 4 },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sortBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sortChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  count: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: "auto" },
  sitTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  sitTypeFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  sitTypeFilterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { padding: 16 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
