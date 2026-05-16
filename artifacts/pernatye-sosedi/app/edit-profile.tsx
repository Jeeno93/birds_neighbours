import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import NativeMap from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";

const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6173 };

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY;
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;
    const res = await fetch(url);
    const data = await res.json();
    return (
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
        ?.metaDataProperty?.GeocoderMetaData?.text ?? ""
    );
  } catch {
    return "";
  }
}

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useApp();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [experienceText, setExperienceText] = useState(
    String(currentUser?.experienceYears ?? 0)
  );
  const [lat, setLat] = useState<number | undefined>(currentUser?.lat);
  const [lng, setLng] = useState<number | undefined>(currentUser?.lng);
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Стартовый центр пикера фиксируем один раз — дальше карта движется
  // под маркером, а NativeMap не перерисовывает WebView.
  const [pickerInitialRegion] = useState({
    latitude: currentUser?.lat ?? MOSCOW_CENTER.latitude,
    longitude: currentUser?.lng ?? MOSCOW_CENTER.longitude,
  });

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const geocodeReqRef = useRef(0);
  const updateMarker = async (latValue: number, lngValue: number) => {
    setLat(latValue);
    setLng(lngValue);
    setLocationConfirmed(false);
    setAddressLoading(true);
    const reqId = ++geocodeReqRef.current;
    const text = await reverseGeocode(latValue, lngValue);
    if (reqId !== geocodeReqRef.current) return; // устаревший ответ
    setAddress(text);
    setAddressLoading(false);
  };

  useEffect(() => {
    // Если у пользователя уже сохранены координаты — показываем для них адрес.
    // Если координат нет — пикер сам отправит первый centerChanged по карте Москвы.
    if (
      currentUser?.lat !== undefined &&
      currentUser?.lng !== undefined &&
      !address
    ) {
      (async () => {
        setAddressLoading(true);
        const reqId = ++geocodeReqRef.current;
        const text = await reverseGeocode(currentUser.lat!, currentUser.lng!);
        if (reqId !== geocodeReqRef.current) return;
        setAddress(text);
        setAddressLoading(false);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const derivedDistrict =
      extractDistrictFromAddress(address) || currentUser.district || "Москва";

    await setCurrentUser({
      ...currentUser,
      name: trimmedName,
      district: derivedDistrict,
      address: address || currentUser.address,
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
          Местоположение
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            minHeight: 36,
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {addressLoading
            ? "Определяем адрес…"
            : address || "Двигайте карту, чтобы выбрать место"}
        </Text>
        <View
          style={{
            width: "100%",
            height: 360,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <NativeMap
            mode="locationPicker"
            region={pickerInitialRegion}
            zoom={15}
            onLocationSelected={({ latitude, longitude }) =>
              updateMarker(latitude, longitude)
            }
          />
        </View>
        <TouchableOpacity
          style={{
            alignSelf: "stretch",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 10,
            backgroundColor: locationConfirmed
              ? colors.secondary
              : colors.primary,
          }}
          onPress={() => {
            setLocationConfirmed(true);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.85}
          disabled={lat === undefined || lng === undefined}
        >
          <Text
            style={{
              color: locationConfirmed ? colors.foreground : "#fff",
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
            }}
          >
            {locationConfirmed ? "✓ Место выбрано" : "Использовать это место"}
          </Text>
        </TouchableOpacity>

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
