import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MOSCOW_DISTRICTS,
  SitRequest,
  SitRequestBird,
  SitType,
  SIT_TYPE_LABELS,
  SPECIES_LABELS,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

export default function NewRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds, addSitRequest, currentUser, neighbors } = useApp();

  const [sitType, setSitType] = useState<SitType | null>(null);
  const [selectedBirds, setSelectedBirds] = useState<SitRequestBird[]>(
    birds[0] ? [{ birdId: birds[0].id, needsMedication: false }] : []
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [district, setDistrict] = useState(currentUser?.district ?? "Арбат");
  const [comment, setComment] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);

  // У юзеров без настоящего telegram_id (моковый id вида `tg_…`) надо
  // отдельно собрать username — иначе ситтеру некуда написать.
  const needsTelegramInput =
    !currentUser?.telegramId || currentUser.telegramId.startsWith("tg_");
  const initialTelegram =
    currentUser?.telegramId && !currentUser.telegramId.startsWith("tg_")
      ? currentUser.telegramId
      : "";
  const [telegramUsername, setTelegramUsername] = useState(initialTelegram);

  const sanitizeTgHandle = (raw: string): string =>
    raw.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const toggleBird = (id: string) => {
    setSelectedBirds((prev) =>
      prev.some((b) => b.birdId === id)
        ? prev.filter((b) => b.birdId !== id)
        : [...prev, { birdId: id, needsMedication: false }]
    );
    Haptics.selectionAsync();
  };

  const toggleMedication = (id: string, value: boolean) => {
    setSelectedBirds((prev) =>
      prev.map((b) => (b.birdId === id ? { ...b, needsMedication: value } : b))
    );
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (!sitType) {
      Alert.alert("Ошибка", "Выберите тип передержки");
      return;
    }
    if (selectedBirds.length === 0) {
      Alert.alert("Ошибка", "Выберите хотя бы одну птицу");
      return;
    }
    if (!dateFrom || !dateTo) {
      Alert.alert("Ошибка", "Укажите даты отъезда");
      return;
    }
    const contactTelegram = sanitizeTgHandle(telegramUsername);
    if (needsTelegramInput && !contactTelegram) {
      Alert.alert(
        "Укажите Telegram",
        "Без username ситтеры не смогут с вами связаться."
      );
      return;
    }

    const needsMedication = selectedBirds.some((b) => b.needsMedication);
    const matchedNeighbors = neighbors.filter((n) => {
      if (n.helpStatus === "not_now") return false;
      if (!(n.sitTypes ?? []).includes(sitType)) return false;
      if (needsMedication && !(n.capabilities ?? []).includes("can_medicate")) return false;
      return true;
    });

    const request: SitRequest = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id ?? "me",
      birds: selectedBirds,
      sitType,
      dateFrom,
      dateTo,
      district,
      comment: comment.trim(),
      contactTelegram,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    await addSitRequest(request);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Запрос создан!",
      `Найдено ${matchedNeighbors.length} подходящих птичников. Напишите им в Telegram!`,
      [{ text: "Отлично", onPress: () => router.back() }]
    );
  };

  if (birds.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Новый запрос</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyCenter}>
          <Feather name="feather" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Сначала добавьте птицу
          </Text>
          <TouchableOpacity
            style={[styles.addBirdBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-bird")}
          >
            <Text style={styles.addBirdBtnText}>Добавить птицу</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const SIT_TYPES_ORDER: SitType[] = ["full", "guest", "medical_only"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Новый запрос</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveBtnText}>Создать</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Какой тип передержки нужен?
        </Text>
        <View style={styles.sitTypeList}>
          {SIT_TYPES_ORDER.map((t) => {
            const active = sitType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.sitTypeOption,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSitType(t);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: active ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {active && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text
                  style={[
                    styles.sitTypeText,
                    { color: active ? colors.primary : colors.foreground },
                  ]}
                >
                  {SIT_TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Какие птицы? (можно несколько)
        </Text>
        <View style={styles.birdsList}>
          {birds.map((b) => {
            const selected = selectedBirds.find((sb) => sb.birdId === b.id);
            const active = Boolean(selected);
            return (
              <View key={b.id} style={{ gap: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.birdOption,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleBird(b.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: active ? "#fff" : "transparent",
                        borderColor: active ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {active && <Feather name="check" size={14} color={colors.primary} />}
                  </View>
                  <BirdSpeciesIcon species={b.species} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.birdName,
                        { color: active ? "#fff" : colors.foreground },
                      ]}
                    >
                      {b.name}
                    </Text>
                    <Text
                      style={[
                        styles.birdSpecies,
                        { color: active ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
                      ]}
                    >
                      {SPECIES_LABELS[b.species]}
                    </Text>
                  </View>
                </TouchableOpacity>
                {active && (
                  <View
                    style={[
                      styles.medicationRow,
                      { backgroundColor: colors.secondary, borderColor: colors.border },
                    ]}
                  >
                    <Feather name="plus-square" size={16} color={colors.primary} />
                    <Text style={[styles.medicationLabel, { color: colors.foreground }]}>
                      Нужно лечение
                    </Text>
                    <Switch
                      value={selected?.needsMedication ?? false}
                      onValueChange={(v) => toggleMedication(b.id, v)}
                      trackColor={{ true: colors.primary, false: colors.border }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Даты отъезда</Text>
        <View style={[styles.datesRow]}>
          <TextInput
            style={[styles.dateInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground, flex: 1 }]}
            placeholder="С (дд.мм.гггг)"
            placeholderTextColor={colors.mutedForeground}
            value={dateFrom}
            onChangeText={setDateFrom}
          />
          <TextInput
            style={[styles.dateInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground, flex: 1 }]}
            placeholder="По (дд.мм.гггг)"
            placeholderTextColor={colors.mutedForeground}
            value={dateTo}
            onChangeText={setDateTo}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Район</Text>
        <TouchableOpacity
          style={[styles.selectBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowDistricts(!showDistricts)}
          activeOpacity={0.8}
        >
          <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}>{district}</Text>
          <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        {showDistricts && (
          <View style={[styles.districtList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {MOSCOW_DISTRICTS.slice(0, 15).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.districtItem, { borderBottomColor: colors.border }]}
                onPress={() => { setDistrict(d); setShowDistricts(false); }}
              >
                <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {needsTelegramInput && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Telegram для связи *
            </Text>
            <TextInput
              style={[
                styles.dateInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  color: colors.foreground,
                },
              ]}
              placeholder="username (без @)"
              placeholderTextColor={colors.mutedForeground}
              value={telegramUsername}
              onChangeText={setTelegramUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                marginTop: 4,
              }}
            >
              Ситтеры свяжутся с вами через Telegram
            </Text>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Комментарий</Text>
        <TextInput
          style={[styles.commentInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
          placeholder="Дополнительная информация..."
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />

        <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            После создания запроса приложение покажет подходящих птичников. Свяжитесь с ними через Telegram.
          </Text>
        </View>
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
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 6 },
  sitTypeList: { gap: 8 },
  sitTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sitTypeText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  birdsList: { gap: 8 },
  birdOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  birdName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  birdSpecies: { fontSize: 12, fontFamily: "Inter_400Regular" },
  medicationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 22,
  },
  medicationLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  datesRow: { flexDirection: "row", gap: 10 },
  dateInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  selectBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  districtList: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 200,
  },
  districtItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
    textAlignVertical: "top",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  addBirdBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addBirdBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
