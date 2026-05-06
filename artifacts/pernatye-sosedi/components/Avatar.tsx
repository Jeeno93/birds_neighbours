import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
}

export function Avatar({ name, photoUrl, size = 40 }: AvatarProps) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.secondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };

  if (photoUrl) {
    return (
      <Image source={{ uri: photoUrl }} style={style} resizeMode="cover" />
    );
  }

  return (
    <View style={style}>
      <Text
        style={{
          fontSize: size * 0.38,
          fontFamily: "Inter_600SemiBold",
          color: colors.primary,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
