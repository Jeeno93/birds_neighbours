import { router, useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import NativeMap, { PickerLocation } from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";
import { setPickedLocation } from "@/utils/pickedLocation";

const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6173 };

export default function PickLocationScreen() {
  const colors = useColors();
  const { initialLat, initialLng } = useLocalSearchParams<{
    initialLat?: string;
    initialLng?: string;
  }>();

  const parsedLat = initialLat ? parseFloat(initialLat) : NaN;
  const parsedLng = initialLng ? parseFloat(initialLng) : NaN;
  const hasInitial = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const lastLocationRef = useRef<PickerLocation>({
    latitude: hasInitial ? parsedLat : MOSCOW_CENTER.latitude,
    longitude: hasInitial ? parsedLng : MOSCOW_CENTER.longitude,
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NativeMap
        mode="locationPicker"
        region={{
          latitude: hasInitial ? parsedLat : MOSCOW_CENTER.latitude,
          longitude: hasInitial ? parsedLng : MOSCOW_CENTER.longitude,
        }}
        initialLat={hasInitial ? parsedLat : undefined}
        initialLng={hasInitial ? parsedLng : undefined}
        onLocationSelected={(loc) => {
          lastLocationRef.current = loc;
        }}
        onConfirm={(loc) => {
          setPickedLocation({
            lat: loc.latitude,
            lng: loc.longitude,
            address:
              (loc.address ?? lastLocationRef.current.address ?? "").trim(),
            city:
              (loc.city ?? lastLocationRef.current.city ?? "Москва").trim() ||
              "Москва",
          });
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
