import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { extractDistrictFromAddress, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { consumePickedLocation } from "@/utils/pickedLocation";
import {
  normalizeTelegramUsername,
  isValidTelegramUsername,
  isContactableTelegram,
} from "@/utils/telegram";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useApp();

  const [name, setName] = useState(currentUser?.name ?? "");
  // Показываем текущий хендл только если он валиден; битый (email/`tg_<n>`)
  // не подставляем, чтобы юзер ввёл корректный заново.
  const [telegram, setTelegram] = useState(
    currentUser && isContactableTelegram(currentUser.telegramId)
      ? currentUser.telegramId
      : ""
  );
  const [experienceText, setExperienceText] = useState(
    String(currentUser?.experienceYears ?? 0)
  );
  const [lat, setLat] = useState<number | undefined>(currentUser?.lat);
  const [lng, setLng] = useState<number | undefined>(currentUser?.lng);
  const [address, setAddress] = useState(currentUser?.address ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [addressComment, setAddressComment] = useState(
    currentUser?.addressComment ?? ""
  );

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  // При возврате с экрана выбора места — подхватываем выбранные координаты.
  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedLocation();
      if (picked) {
        setLat(picked.lat);
        setLng(picked.lng);
        if (picked.address) setAddress(picked.address);
        if (picked.city) setCity(picked.city);
      }
    }, [])
  );

  const openPicker = () => {
    router.push({
      pathname: "/pick-location",
      params: {
        ...(lat !== undefined ? { initialLat: String(lat) } : {}),
        ...(lng !== undefined ? { initialLng: String(lng) } : {}),
      },
    });
  };

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
    const handle = normalizeTelegramUsername(telegram);
    if (!isValidTelegramUsername(handle)) {
      Alert.alert(
        "Проверьте Telegram",
        "Username: 5–32 символа, латиница/цифры/_, начинается с буквы. Без @ и без email."
      );
      return;
    }
    const parsedYears = parseInt(experienceText, 10);
    const experienceYears =
      Number.isFinite(parsedYears) && parsedYears >= 0 ? parsedYears : 0;

    const derivedDistrict =
      extractDistrictFromAddress(address) || currentUser.district || "Москва";

    await setCurrentUser({
      ...currentUser,
      name: trimmedName,
      telegramId: handle,
      city: city || currentUser.city || "Москва",
      district: derivedDistrict,
      address: address || currentUser.address,
      addressComment: addressComment || undefined,
      lat,
      lng,
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

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Telegram для связи
        </Text>
        <View
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 0,
            },
          ]}
        >
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15 }}>
            @
          </Text>
          <TextInput
            style={{
              flex: 1,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              paddingVertical: 14,
              paddingLeft: 2,
            }}
            placeholder="username"
            placeholderTextColor={colors.mutedForeground}
            value={telegram}
            onChangeText={setTelegram}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
          По нему соседи напишут вам — кнопка «Написать в Telegram».
        </Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Местоположение
        </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Адрес
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              marginBottom: 12,
            }}
            numberOfLines={3}
          >
            {address || "Не указано"}
          </Text>
          <TouchableOpacity
            onPress={openPicker}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 10,
            }}
          >
            <Feather name="map" size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              {lat !== undefined && lng !== undefined
                ? "Изменить на карте"
                : "Выбрать на карте"}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            Город:
          </Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Москва"
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingVertical: 4,
            }}
          />
        </View>

        <TextInput
          placeholder="Комментарий к адресу: подъезд, домофон, особенности ЖК..."
          placeholderTextColor={colors.mutedForeground}
          value={addressComment}
          onChangeText={setAddressComment}
          multiline
          numberOfLines={2}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            color: colors.foreground,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            marginTop: 12,
            minHeight: 64,
            textAlignVertical: "top",
          }}
        />

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
});
