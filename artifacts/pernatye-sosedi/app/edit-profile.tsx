import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
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
import { MOSCOW_DISTRICTS, useApp } from "@/context/AppContext";
import NativeMap, { MarkerData } from "@/components/NativeMap";
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
  const [district, setDistrict] = useState(currentUser?.district ?? "Арбат");
  const [experienceText, setExperienceText] = useState(
    String(currentUser?.experienceYears ?? 0)
  );
  const [showDistricts, setShowDistricts] = useState(false);
  const [lat, setLat] = useState<number | undefined>(currentUser?.lat);
  const [lng, setLng] = useState<number | undefined>(currentUser?.lng);
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

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

  const requestAutoLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        await updateMarker(location.coords.latitude, location.coords.longitude);
      }
    } catch {
      // не удалось — пользователь поставит маркер вручную
    }
  };

  useEffect(() => {
    // При первом открытии: если координат нет — запрашиваем автоматически.
    // Если координаты уже есть — подгружаем адрес для них.
    if (lat === undefined || lng === undefined) {
      requestAutoLocation();
    } else if (!address) {
      (async () => {
        setAddressLoading(true);
        const reqId = ++geocodeReqRef.current;
        const text = await reverseGeocode(lat, lng);
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

    await setCurrentUser({
      ...currentUser,
      name: trimmedName,
      district,
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

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 0 }]}>
            Местоположение
          </Text>
          <TouchableOpacity onPress={requestAutoLocation} activeOpacity={0.7}>
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_500Medium" }}>
              Определить автоматически
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            width: "100%",
            height: 220,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 4,
          }}
        >
          <NativeMap
            region={{
              latitude: lat ?? MOSCOW_CENTER.latitude,
              longitude: lng ?? MOSCOW_CENTER.longitude,
            }}
            zoom={14}
            onMapPress={({ latitude, longitude }) =>
              updateMarker(latitude, longitude)
            }
            markers={
              lat !== undefined && lng !== undefined
                ? ([
                    {
                      id: "me",
                      latitude: lat,
                      longitude: lng,
                      title: "Ваше место",
                      markerColor: colors.primary,
                      draggable: true,
                    },
                  ] as MarkerData[])
                : []
            }
          />
        </View>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {addressLoading
            ? "Определяем адрес…"
            : address || "Нажмите на карту, чтобы выбрать место"}
        </Text>
        {lat !== undefined && lng !== undefined && (
          <TouchableOpacity
            style={{
              alignSelf: "stretch",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 8,
              backgroundColor: locationConfirmed
                ? colors.secondary
                : colors.primary,
            }}
            onPress={() => {
              setLocationConfirmed(true);
              Haptics.selectionAsync();
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: locationConfirmed ? colors.foreground : "#fff",
                fontFamily: "Inter_500Medium",
                fontSize: 14,
              }}
            >
              {locationConfirmed ? "✓ Место выбрано" : "Использовать это место"}
            </Text>
          </TouchableOpacity>
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
