import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BirdSpecies, useApp } from "@/context/AppContext";
import NativeMap, { MarkerData, Region } from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";

const SPECIES_FILTER: { key: BirdSpecies | "all"; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "parrot_corella", label: "Корелла" },
  { key: "parrot_budgie", label: "Волнистый" },
  { key: "canary", label: "Канарейка" },
  { key: "pigeon", label: "Голубь" },
  { key: "other", label: "Другие" },
];

const MOCK_USER_BIRDS: Record<string, BirdSpecies[]> = {
  n1: ["parrot_corella", "parrot_budgie"],
  n2: ["canary"],
  n3: ["parrot_budgie", "parrot_budgie"],
  n4: ["pigeon", "parrot_corella"],
  n5: ["canary", "other"],
  n6: ["parrot_pyrrhura"],
  n7: ["parrot_lovebird"],
  n8: ["parrot_jaco"],
  n9: ["parrot_rosella", "canary"],
  n10: ["parrot_amazon"],
  n11: ["parrot_alexandrine", "parrot_budgie"],
  n12: ["parrot_ara"],
  n13: ["finch"],
  n14: ["parrot_kakadu", "parrot_corella"],
  n15: ["parrot_eclectus"],
  n16: ["parakeet_kakariki", "parrot_budgie"],
  n17: ["parrot_jaco", "parrot_lovebird"],
  n18: ["pigeon"],
  n19: ["parrot_pyrrhura", "canary"],
  n20: ["other"],
};

const MOSCOW_REGION: Region = {
  latitude: 55.7558,
  longitude: 37.6173,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { neighbors, sitRequests } = useApp();

  const [filterSpecies, setFilterSpecies] = useState<BirdSpecies | "all">("all");

  const filtered = neighbors.filter((n) => {
    if (filterSpecies === "all") return true;
    const birds = MOCK_USER_BIRDS[n.id] || [];
    return birds.includes(filterSpecies as BirdSpecies);
  });

  const activeRequest = sitRequests
    .filter((r) => r.status === "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const matchCtx = activeRequest
    ? {
        sitType: activeRequest.sitType,
        needsMedication: activeRequest.birds.some((b) => b.needsMedication),
      }
    : null;

  const mapMarkers = useMemo<MarkerData[]>(
    () =>
      filtered
        .filter((n): n is typeof n & { lat: number; lng: number } =>
          typeof n.lat === "number" && typeof n.lng === "number"
        )
        .map((n) => {
          const caps = n.capabilities ?? [];
          let compatible = true;
          if (matchCtx) {
            if (matchCtx.needsMedication && !caps.includes("can_medicate")) compatible = false;
            if (matchCtx.sitType === "full" && !caps.includes("can_host")) compatible = false;
            if (matchCtx.sitType === "guest" && !caps.includes("can_visit")) compatible = false;
          }
          return {
            id: n.id,
            latitude: n.lat,
            longitude: n.lng,
            title: `${n.name} · ${n.district}`,
            isSelected: false,
            markerColor: compatible ? undefined : "#9ca3af",
          };
        }),
    [filtered, matchCtx]
  );

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleMarkerPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/neighbor/${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Карта птичников
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {filtered.length} рядом
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/neighbors")}
          activeOpacity={0.8}
        >
          <Feather name="list" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterBarContent}
      >
        {SPECIES_FILTER.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              {
                backgroundColor: filterSpecies === f.key ? colors.primary : colors.card,
                borderColor: filterSpecies === f.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setFilterSpecies(f.key);
              Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                { color: filterSpecies === f.key ? "#fff" : colors.foreground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View
        style={[
          styles.cityCounter,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <Feather name="users" size={12} color={colors.mutedForeground} />
        <Text style={[styles.cityCounterText, { color: colors.mutedForeground }]}>
          {" "}{neighbors.length} птичников в Москве
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <NativeMap
          region={MOSCOW_REGION}
          markers={mapMarkers}
          onMarkerPress={handleMarkerPress}
        />
        {sitRequests.length === 0 && (
          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                bottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) + 60,
              },
            ]}
          >
            <Text style={{ fontSize: 36, textAlign: "center" }}>📅</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Создай первый запрос
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginTop: 6,
                textAlign: "center",
                lineHeight: 19,
              }}
            >
              Уезжаешь — оставь запрос на присмотр. Птичники из карты увидят его и напишут в Telegram.
            </Text>
            <TouchableOpacity
              style={[styles.hintBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/new-request")}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.hintBtnText}> Новый запрос</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  cityCounter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  cityCounterText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  mapContainer: { flex: 1 },
  hintCard: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  hintBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
