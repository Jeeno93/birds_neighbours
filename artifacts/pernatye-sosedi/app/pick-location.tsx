import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NativeMap from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";
import { setPickedLocation } from "@/utils/pickedLocation";

const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6173 };

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ text: string; city: string }> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY;
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;
    const res = await fetch(url);
    const data = await res.json();
    const geoObject =
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    const text =
      geoObject?.metaDataProperty?.GeocoderMetaData?.text ?? "";
    const components: Array<{ kind: string; name: string }> =
      geoObject?.metaDataProperty?.GeocoderMetaData?.Address?.Components ?? [];
    const city =
      components.find((c) => c.kind === "locality")?.name ??
      components.find((c) => c.kind === "province")?.name ??
      "";
    return { text, city };
  } catch {
    return { text: "", city: "" };
  }
}

export default function PickLocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { initialLat, initialLng } = useLocalSearchParams<{
    initialLat?: string;
    initialLng?: string;
  }>();

  const parsedLat = initialLat ? parseFloat(initialLat) : NaN;
  const parsedLng = initialLng ? parseFloat(initialLng) : NaN;
  const hasInitial = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const [lat, setLat] = useState<number>(
    hasInitial ? parsedLat : MOSCOW_CENTER.latitude
  );
  const [lng, setLng] = useState<number>(
    hasInitial ? parsedLng : MOSCOW_CENTER.longitude
  );
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [autoLocating, setAutoLocating] = useState<boolean>(false);

  // Стартовый центр карты замораживаем после первой геолокации (или
  // сразу же — если initialLat/initialLng переданы). Это ремаунтит
  // WebView один раз с корректным центром, а дальше пользовательские
  // жесты не сбрасываются.
  const [pickerRegion, setPickerRegion] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: hasInitial ? parsedLat : MOSCOW_CENTER.latitude,
    longitude: hasInitial ? parsedLng : MOSCOW_CENTER.longitude,
  });
  const regionInitialized = useRef<boolean>(hasInitial);

  const geocodeReqRef = useRef(0);
  const doGeocode = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    const reqId = ++geocodeReqRef.current;
    const { text, city: detectedCity } = await reverseGeocode(latitude, longitude);
    if (reqId !== geocodeReqRef.current) return;
    setAddress(text);
    if (detectedCity) setCity(detectedCity);
    setIsGeocoding(false);
  };

  const handleAutoLocation = async () => {
    setAutoLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAutoLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const newLat = loc.coords.latitude;
      const newLng = loc.coords.longitude;
      setLat(newLat);
      setLng(newLng);
      if (!regionInitialized.current) {
        setPickerRegion({ latitude: newLat, longitude: newLng });
        regionInitialized.current = true;
      }
      await doGeocode(newLat, newLng);
    } catch {
      // ignore
    }
    setAutoLocating(false);
  };

  useEffect(() => {
    if (hasInitial) {
      doGeocode(parsedLat, parsedLng);
    } else {
      handleAutoLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    await Haptics.selectionAsync();
    setPickedLocation({
      lat,
      lng,
      address,
      city: city || "Москва",
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Адрес сверху */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.card,
            paddingTop: insets.top + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.addressText, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {isGeocoding
              ? "Определяем адрес…"
              : address || "Двигайте карту, чтобы выбрать место"}
          </Text>
          {city ? (
            <Text style={[styles.cityText, { color: colors.mutedForeground }]}>
              {city}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Карта на весь экран */}
      <View style={styles.mapWrap}>
        <NativeMap
          key={`picker-${pickerRegion.latitude.toFixed(4)},${pickerRegion.longitude.toFixed(4)}`}
          mode="locationPicker"
          region={pickerRegion}
          zoom={15}
          onLocationSelected={({ latitude, longitude }) => {
            setLat(latitude);
            setLng(longitude);
            doGeocode(latitude, longitude);
          }}
        />
      </View>

      {/* Кнопки снизу */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleAutoLocation}
          disabled={autoLocating}
          style={[
            styles.autoBtn,
            { borderColor: colors.primary, opacity: autoLocating ? 0.6 : 1 },
          ]}
          activeOpacity={0.85}
        >
          {autoLocating ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Feather name="crosshair" size={16} color={colors.primary} />
              <Text style={[styles.autoBtnText, { color: colors.primary }]}>
                Определить автоматически
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Использовать это место</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    ...(Platform.OS === "android"
      ? { elevation: 4 }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }),
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cityText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  mapWrap: { flex: 1 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
    ...(Platform.OS === "android"
      ? { elevation: 4 }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
        }),
    zIndex: 10,
  },
  autoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  autoBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
