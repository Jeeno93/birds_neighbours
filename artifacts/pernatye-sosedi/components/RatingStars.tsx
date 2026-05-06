import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface RatingStarsProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

export function RatingStars({
  rating,
  size = 14,
  showNumber = true,
}: RatingStarsProps) {
  const colors = useColors();
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name={i <= full ? "star" : half && i === full + 1 ? "star" : "star"}
          size={size}
          color={i <= Math.round(rating) ? colors.star : colors.border}
          style={{ marginRight: 1 }}
        />
      ))}
      {showNumber && (
        <Text
          style={[styles.num, { color: colors.mutedForeground, fontSize: size }]}
        >
          {" "}
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  num: { marginLeft: 2 },
});
