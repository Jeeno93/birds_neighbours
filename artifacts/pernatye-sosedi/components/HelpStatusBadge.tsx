import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HelpStatus, HELP_STATUS_COLORS, HELP_STATUS_LABELS } from "@/context/AppContext";

interface HelpStatusBadgeProps {
  status: HelpStatus;
  size?: "sm" | "md";
}

export function HelpStatusBadge({ status, size = "md" }: HelpStatusBadgeProps) {
  const color = HELP_STATUS_COLORS[status];
  const label = HELP_STATUS_LABELS[status];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "20",
          borderColor: color + "50",
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.label,
          { color, fontSize: isSmall ? 11 : 13 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontFamily: "Inter_500Medium",
  },
});
