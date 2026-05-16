import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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
  SitRequestBird,
  SitType,
  SIT_TYPE_LABELS,
  SPECIES_LABELS,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

const SIT_TYPES_ORDER: SitType[] = ["full", "guest", "medical_only"];

// Существующие запросы могут содержать дату либо как `YYYY-MM-DD`
// (после миграции на бэкенд), либо как `DD.MM.YYYY` (старый локальный
// формат). Поддерживаем оба варианта; на любую невалидную строку
// возвращаем сегодня, чтобы пикер не получил Invalid Date.
function parseStoredDate(value: string | undefined): Date {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  const parts = value.split(".");
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// Собираем YYYY-MM-DD из локальных компонент даты, а не через
// toISOString(): последний переводит локальную полночь в UTC и в
// часовых поясах с положительным смещением (например, Москва UTC+3)
// отдаёт предыдущий календарный день.
const toISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function EditRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { birds, sitRequests, updateSitRequest } = useApp();

  const existing = sitRequests.find((r) => r.id === id);

  const [sitType, setSitType] = useState<SitType | null>(existing?.sitType ?? null);
  const [selectedBirds, setSelectedBirds] = useState<SitRequestBird[]>(
    existing?.birds ?? []
  );
  const [dateFrom, setDateFrom] = useState<Date>(parseStoredDate(existing?.dateFrom));
  const [dateTo, setDateTo] = useState<Date>(parseStoredDate(existing?.dateTo));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  // Район сохраняется как был — отдельный селектор района убран,
  // район выводится автоматически из адреса в профиле.
  const district = existing?.district ?? "Москва";
  const [comment, setComment] = useState(existing?.comment ?? "");

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const toggleBird = (bid: string) => {
    setSelectedBirds((prev) =>
      prev.some((b) => b.birdId === bid)
        ? prev.filter((b) => b.birdId !== bid)
        : [...prev, { birdId: bid, needsMedication: false }]
    );
    Haptics.selectionAsync();
  };

  const toggleMedication = (bid: string, value: boolean) => {
    setSelectedBirds((prev) =>
      prev.map((b) => (b.birdId === bid ? { ...b, needsMedication: value } : b))
    );
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!existing) {
      Alert.alert("Ошибка", "Запрос не найден");
      return;
    }
    if (!sitType) {
      Alert.alert("Ошибка", "Выберите тип передержки");
      return;
    }
    if (selectedBirds.length === 0) {
      Alert.alert("Ошибка", "Выберите хотя бы одну птицу");
      return;
    }
    if (dateTo < dateFrom) {
      Alert.alert("Ошибка", "Дата окончания не может быть раньше даты начала");
      return;
    }

    await updateSitRequest(existing.id, {
      sitType,
      birds: selectedBirds,
      dateFrom: toISODate(dateFrom),
      dateTo: toISODate(dateTo),
      district,
      comment: comment.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (!existing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Редактировать
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyCenter}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Запрос не найден
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Редактировать запрос
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveBtnText}>Сохранить</Text>
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
          <TouchableOpacity
            style={[
              styles.datePickerBtn,
              { borderColor: colors.border, backgroundColor: colors.card, flex: 1 },
            ]}
            onPress={() => setShowFromPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.datePickerText, { color: colors.foreground }]}>
              {formatDate(dateFrom)}
            </Text>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.datePickerBtn,
              { borderColor: colors.border, backgroundColor: colors.card, flex: 1 },
            ]}
            onPress={() => setShowToPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.datePickerText, { color: colors.foreground }]}>
              {formatDate(dateTo)}
            </Text>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={dateFrom}
            mode="date"
            display="default"
            locale="ru-RU"
            minimumDate={new Date()}
            onChange={(_event, date) => {
              setShowFromPicker(false);
              if (date) {
                setDateFrom(date);
                if (dateTo < date) setDateTo(date);
              }
            }}
          />
        )}

        {showToPicker && (
          <DateTimePicker
            value={dateTo}
            mode="date"
            display="default"
            locale="ru-RU"
            minimumDate={dateFrom}
            onChange={(_event, date) => {
              setShowToPicker(false);
              if (date) setDateTo(date);
            }}
          />
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
  datePickerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
    textAlignVertical: "top",
  },
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
