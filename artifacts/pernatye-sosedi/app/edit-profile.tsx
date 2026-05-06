import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOSCOW_DISTRICTS, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useApp();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [district, setDistrict] = useState(currentUser?.district ?? "Арбат");
  const [experienceText, setExperienceText] = useState(
    String(currentUser?.experienceYears ?? 0)
  );
  const [showDistricts, setShowDistricts] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert("Ошибка", "Профиль не найден");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Ошибка", "Введите имя");
      return;
    }
    const parsedYears = parseInt(experienceText, 10);
    const experienceYears =
      Number.isFinite(parsedYears) && parsedYears >= 0 ? parsedYears : 0;

    await setCurrentUser({
      ...currentUser,
      name: trimmedName,
      district,
      experienceYears,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Редактировать профиль
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Имя</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.foreground,
            },
          ]}
          placeholder="Как к вам обращаться"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Район</Text>
        <TouchableOpacity
          style={[
            styles.selectBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          onPress={() => setShowDistricts((v) => !v)}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
            }}
          >
            {district}
          </Text>
          <Feather
            name={showDistricts ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        {showDistricts && (
          <View
            style={[
              styles.districtList,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
              {MOSCOW_DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.districtItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    setDistrict(d);
                    setShowDistricts(false);
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {d}
                  </Text>
                  {district === d ? (
                    <Feather name="check" size={16} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Годы опыта с птицами
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.foreground,
            },
          ]}
          placeholder="Например, 3"
          placeholderTextColor={colors.mutedForeground}
          value={experienceText}
          onChangeText={(t) => setExperienceText(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={2}
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
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 16, gap: 8 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  selectBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  districtList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  districtItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
