import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/api/client";
import {
  Linking as RNLinking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SIT_TYPE_SHORT,
  SitRequest,
  User,
  useApp,
} from "@/context/AppContext";
import NativeMap, { MarkerData, Region } from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";

const REQUEST_MARKER_COLOR = "#f59e0b";

const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Замоскворечье": { lat: 55.734, lng: 37.628 },
  "Арбат": { lat: 55.748, lng: 37.593 },
  "Хамовники": { lat: 55.727, lng: 37.567 },
  "Пресненский": { lat: 55.759, lng: 37.577 },
  "Таганский": { lat: 55.741, lng: 37.65 },
  "Якиманка": { lat: 55.735, lng: 37.611 },
  "Тверской": { lat: 55.768, lng: 37.605 },
  "Басманный": { lat: 55.766, lng: 37.665 },
  "Мещанский": { lat: 55.78, lng: 37.633 },
  "Красносельский": { lat: 55.78, lng: 37.66 },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const MOSCOW_REGION: Region = {
  latitude: 55.7558,
  longitude: 37.6173,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { neighbors, sitRequests, openRequests, currentUser } = useApp();

  const [mapLayer, setMapLayer] = useState<"community" | "requests">("community");
  const [selectedRequest, setSelectedRequest] = useState<SitRequest | null>(null);
  const [fetchedAuthor, setFetchedAuthor] = useState<User | null>(null);

  // Без мок-данных по птицам у каждого соседа фильтр по виду применить
  // нечем (API ещё не отдаёт сводку птиц по соседу). Пока показываем
  // всех — фильтр-чипсы убраны из UI ниже.
  const filtered = neighbors;

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

  // Только чужие открытые запросы (свои не показываем — они и так видны во вкладке профиля).
  const visibleRequests = useMemo(
    () => openRequests.filter((r) => r.userId !== currentUser?.id),
    [openRequests, currentUser?.id]
  );

  const requestMarkers = useMemo<MarkerData[]>(() => {
    const out: MarkerData[] = [];
    for (const r of visibleRequests) {
      const author = neighbors.find((n) => n.id === r.userId);
      const coords =
        author && typeof author.lat === "number" && typeof author.lng === "number"
          ? { lat: author.lat, lng: author.lng }
          : DISTRICT_COORDS[r.district];
      if (!coords) continue;
      out.push({
        id: `req-${r.id}`,
        latitude: coords.lat,
        longitude: coords.lng,
        title: `${formatDate(r.dateFrom)} — ${formatDate(r.dateTo)} · ${r.district}`,
        isSelected: selectedRequest?.id === r.id,
        markerColor: REQUEST_MARKER_COLOR,
      });
    }
    return out;
  }, [visibleRequests, neighbors, selectedRequest?.id]);

  const handleMarkerPress = (id: string) => {
    Haptics.selectionAsync();
    if (mapLayer === "requests") {
      const reqId = id.startsWith("req-") ? id.slice(4) : id;
      const req = visibleRequests.find((r) => r.id === reqId);
      if (req) setSelectedRequest(req);
      return;
    }
    router.push(`/neighbor/${id}`);
  };

  const handleLayerChange = (next: "community" | "requests") => {
    if (next === mapLayer) return;
    Haptics.selectionAsync();
    setMapLayer(next);
    setSelectedRequest(null);
  };

  const requestAuthor = selectedRequest
    ? neighbors.find((n) => n.id === selectedRequest.userId) ??
      (fetchedAuthor?.id === selectedRequest.userId ? fetchedAuthor : null)
    : null;

  // Подгружаем автора, если его нет в `neighbors` — нужен только для
  // отображения имени; контакт берём из `selectedRequest.contactTelegram`.
  useEffect(() => {
    if (!selectedRequest) return;
    if (neighbors.some((n) => n.id === selectedRequest.userId)) return;
    if (fetchedAuthor?.id === selectedRequest.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<User>(`/api/users/${selectedRequest.userId}`);
        if (!cancelled && data?.id) setFetchedAuthor(data);
      } catch {
        // игнорируем — UI просто покажет «Птичник» без имени
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRequest, neighbors, fetchedAuthor?.id]);

  // Если выбранный запрос пропал из видимого списка (например, после
  // загрузки `currentUser` оказался своим, или статус обновился), —
  // закрываем оверлей, чтобы не висел на устаревших данных.
  useEffect(() => {
    if (selectedRequest && !visibleRequests.some((r) => r.id === selectedRequest.id)) {
      setSelectedRequest(null);
    }
  }, [visibleRequests, selectedRequest]);

  // Нормализация Telegram-хендла: убираем @, пробелы, оставляем только
  // допустимые символы. Это адрес для deep-link, не URL-параметр.
  const sanitizeTgHandle = (raw: string): string =>
    raw.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");

  // Контакт берём из самого запроса — его автор указал явно при создании.
  // На профиль автора больше не полагаемся: мок-`tg_<n>` не открыть в TG.
  const contactHandle = sanitizeTgHandle(selectedRequest?.contactTelegram ?? "");
  const hasContact = Boolean(contactHandle);

  const handleRespond = async () => {
    if (!contactHandle) return;
    const tg = `tg://resolve?domain=${contactHandle}`;
    const web = `https://t.me/${encodeURIComponent(contactHandle)}`;
    try {
      const supported = await Linking.canOpenURL(tg);
      await RNLinking.openURL(supported ? tg : web);
    } catch {
      RNLinking.openURL(web).catch(() => {});
    }
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

      <View
        style={[
          styles.layerSwitch,
          { backgroundColor: colors.secondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.layerBtn,
            mapLayer === "community" && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleLayerChange("community")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.layerBtnText,
              { color: mapLayer === "community" ? "#fff" : colors.foreground },
            ]}
          >
            🐦 Птичники
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.layerBtn,
            mapLayer === "requests" && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleLayerChange("requests")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.layerBtnText,
              { color: mapLayer === "requests" ? "#fff" : colors.foreground },
            ]}
          >
            📋 Передержки
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.cityCounter,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <Feather
          name={mapLayer === "community" ? "users" : "calendar"}
          size={12}
          color={colors.mutedForeground}
        />
        <Text style={[styles.cityCounterText, { color: colors.mutedForeground }]}>
          {mapLayer === "community"
            ? ` ${neighbors.length} птичников в Москве`
            : ` ${visibleRequests.length} открытых запросов на передержку`}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <NativeMap
          region={MOSCOW_REGION}
          markers={mapLayer === "community" ? mapMarkers : requestMarkers}
          onMarkerPress={handleMarkerPress}
        />

        {mapLayer === "requests" && selectedRequest && (
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
            <View style={styles.requestCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.requestCardTitle, { color: colors.foreground }]}>
                  {requestAuthor?.name ?? "Птичник"}
                </Text>
                <Text style={[styles.requestCardSub, { color: colors.mutedForeground }]}>
                  {selectedRequest.district}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedRequest(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.requestRow}>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[styles.requestRowText, { color: colors.foreground }]}>
                {" "}{formatDate(selectedRequest.dateFrom)} — {formatDate(selectedRequest.dateTo)}
              </Text>
            </View>
            <View style={styles.requestRow}>
              <Text style={[styles.requestRowText, { color: colors.foreground }]}>
                {SIT_TYPE_SHORT[selectedRequest.sitType]}
              </Text>
            </View>
            <View style={styles.requestRow}>
              <Feather name="feather" size={14} color={colors.mutedForeground} />
              <Text style={[styles.requestRowText, { color: colors.foreground }]}>
                {" "}{selectedRequest.birds.length}{" "}
                {selectedRequest.birds.length === 1
                  ? "птица"
                  : selectedRequest.birds.length < 5
                  ? "птицы"
                  : "птиц"}
                {selectedRequest.birds.some((b) => b.needsMedication)
                  ? " · нужны лекарства"
                  : ""}
              </Text>
            </View>
            {selectedRequest.comment ? (
              <Text
                style={[styles.requestComment, { color: colors.mutedForeground }]}
                numberOfLines={3}
              >
                {selectedRequest.comment}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.hintBtn,
                {
                  backgroundColor: hasContact ? colors.primary : colors.muted,
                },
              ]}
              onPress={handleRespond}
              disabled={!hasContact}
              activeOpacity={0.8}
            >
              <Feather name="send" size={14} color="#fff" />
              <Text style={styles.hintBtnText}>
                {hasContact ? " Откликнуться в Telegram" : " Контакт не указан"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mapLayer === "requests" && !selectedRequest && visibleRequests.length === 0 && (
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
            <Text style={{ fontSize: 36, textAlign: "center" }}>📋</Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Пока нет открытых запросов
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
              Когда соседи начнут искать передержку, их запросы появятся здесь.
            </Text>
          </View>
        )}

        {mapLayer === "community" && sitRequests.length === 0 && (
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
  layerSwitch: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  layerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 17,
    alignItems: "center",
  },
  layerBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  requestCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  requestCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  requestCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  requestRowText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  requestComment: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    lineHeight: 17,
  },
});
