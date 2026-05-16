import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HELP_STATUS_LABELS,
  HelpStatus,
  OTHER_PET_LABELS,
  OtherPetType,
  SITTER_CAPABILITY_LABELS,
  SIT_TYPE_LABELS,
  SitType,
  SitterCapability,
  useApp,
} from "@/context/AppContext";
import { Avatar } from "@/components/Avatar";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { useColors } from "@/hooks/useColors";

const PET_TYPES: OtherPetType[] = ["dog", "cat", "rodent", "reptile", "fish", "other"];
const SIT_TYPES_ORDER: SitType[] = ["full", "guest", "medical_only"];
const CAPABILITIES_ORDER: SitterCapability[] = [
  "can_medicate",
  "can_release",
  "can_host",
  "can_visit",
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    birds,
    sitRequests,
    updateHelpStatus,
    updateOtherPets,
    updateSitTypes,
    updateCapabilities,
  } = useApp();

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [showStatusPicker, setShowStatusPicker] = useState(false);

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Text style={{ color: colors.mutedForeground }}>Нет профиля</Text>
        </View>
      </View>
    );
  }

  const handleStatusChange = async (status: HelpStatus) => {
    await updateHelpStatus(status);
    setShowStatusPicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selectedPets = new Set((currentUser.otherPets ?? []).map((p) => p.type));

  const togglePet = (type: OtherPetType) => {
    const next = new Set(selectedPets);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    updateOtherPets(Array.from(next).map((t) => ({ type: t })));
    Haptics.selectionAsync();
  };

  const selectedSitTypes = new Set(currentUser.sitTypes ?? []);

  const toggleSitType = (type: SitType) => {
    const next = new Set(selectedSitTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    updateSitTypes(Array.from(next));
    Haptics.selectionAsync();
  };

  const selectedCapabilities = new Set(currentUser.capabilities ?? []);

  const toggleCapability = (cap: SitterCapability) => {
    const next = new Set(selectedCapabilities);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    updateCapabilities(Array.from(next));
    Haptics.selectionAsync();
  };

  const openSitRequests = () => router.push("/sit-requests");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
          <Feather name="settings" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileTop}>
            <Avatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={64} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {currentUser.name}
              </Text>
              <View style={styles.row}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text
                  style={[styles.district, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {" "}{currentUser.address || currentUser.district}
                </Text>
              </View>
              <Text style={[styles.experience, { color: colors.mutedForeground }]}>
                {currentUser.experienceYears} {getYearsLabel(currentUser.experienceYears)} с птицами
              </Text>
              {currentUser.rating > 0 && (
                <RatingStars rating={currentUser.rating} />
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                Готовность помогать
              </Text>
              <HelpStatusBadge status={currentUser.helpStatus} />
            </View>
            <TouchableOpacity
              style={[styles.editStatusBtn, { borderColor: colors.border }]}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showStatusPicker && (
            <View style={styles.statusPicker}>
              {(["ready", "sometimes", "not_now"] as HelpStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        currentUser.helpStatus === s ? colors.secondary : "transparent",
                    },
                  ]}
                  onPress={() => handleStatusChange(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusOptionText, { color: colors.foreground }]}>
                    {HELP_STATUS_LABELS[s]}
                  </Text>
                  {currentUser.helpStatus === s && (
                    <Feather name="check" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.petsBlock}>
            <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
              Что я готов делать
            </Text>
            <Text style={[styles.petsHint, { color: colors.mutedForeground }]}>
              Выберите, какие виды передержки вам подходят
            </Text>
            <View style={{ gap: 8, marginTop: 4 }}>
              {SIT_TYPES_ORDER.map((t) => {
                const active = selectedSitTypes.has(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleSitType(t)}
                    activeOpacity={0.8}
                    style={[
                      styles.sitTypeChip,
                      {
                        backgroundColor: active ? colors.secondary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={active ? "check-square" : "square"}
                      size={18}
                      color={active ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.sitTypeChipText,
                        { color: active ? colors.primary : colors.foreground },
                      ]}
                    >
                      {SIT_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.petsBlock}>
            <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
              Что я умею как ситтер
            </Text>
            <Text style={[styles.petsHint, { color: colors.mutedForeground }]}>
              Это поможет хозяевам понять, подойдёте ли вы под их запрос
            </Text>
            <View style={styles.petsRow}>
              {CAPABILITIES_ORDER.map((c) => {
                const active = selectedCapabilities.has(c);
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => toggleCapability(c)}
                    activeOpacity={0.8}
                    style={[
                      styles.petChip,
                      {
                        backgroundColor: active ? colors.primary : colors.secondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.petChipText,
                        { color: active ? "#fff" : colors.foreground },
                      ]}
                    >
                      {SITTER_CAPABILITY_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.petsBlock}>
            <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
              Другие питомцы дома
            </Text>
            <Text style={[styles.petsHint, { color: colors.mutedForeground }]}>
              Это поможет соседям понять, подойдёт ли им ваша компания
            </Text>
            <View style={styles.petsRow}>
              {PET_TYPES.map((t) => {
                const active = selectedPets.has(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => togglePet(t)}
                    activeOpacity={0.8}
                    style={[
                      styles.petChip,
                      {
                        backgroundColor: active ? colors.primary : colors.secondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.petChipText,
                        { color: active ? "#fff" : colors.foreground },
                      ]}
                    >
                      {OTHER_PET_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{birds.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Птиц</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{sitRequests.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Запросов</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Отзывов</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Запросы</Text>
          <TouchableOpacity
            style={[styles.requestBtn, { backgroundColor: colors.primary }]}
            onPress={openSitRequests}
            activeOpacity={0.8}
          >
            <Feather name="calendar" size={16} color="#fff" />
            <Text style={styles.requestBtnText}>Мои запросы на присмотр</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newRequestBtn, { borderColor: colors.primary }]}
            onPress={() => router.push("/new-request")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.newRequestBtnText, { color: colors.primary }]}>
              Создать новый запрос
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function getYearsLabel(n: number) {
  if (n === 1) return "год";
  if (n >= 2 && n <= 4) return "года";
  return "лет";
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
  settingsBtn: { padding: 4 },
  content: { padding: 16, gap: 16 },
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  profileTop: { flexDirection: "row", gap: 14 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  row: { flexDirection: "row", alignItems: "center" },
  district: { fontSize: 13, fontFamily: "Inter_400Regular" },
  experience: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  editStatusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPicker: { gap: 2 },
  statusOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  statusOptionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  petsBlock: { gap: 8 },
  petsHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -2 },
  petsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  petChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  petChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sitTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sitTypeChipText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  requestBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  newRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  newRequestBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
});
