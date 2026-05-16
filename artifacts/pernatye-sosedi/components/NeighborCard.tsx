import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { HELP_STATUS_COLORS, OTHER_PET_LABELS, User } from "@/context/AppContext";
import { Avatar } from "./Avatar";
import { HelpStatusBadge } from "./HelpStatusBadge";
import { RatingStars } from "./RatingStars";
import { useColors } from "@/hooks/useColors";

interface NeighborCardProps {
  user: User;
  onPress?: () => void;
  mayNotMatch?: boolean;
}

export function NeighborCard({ user, onPress, mayNotMatch }: NeighborCardProps) {
  const colors = useColors();

  const handlePress = onPress || (() => router.push(`/neighbor/${user.id}`));

  const openTelegram = () => {
    const url = `tg://resolve?domain=${user.telegramId}`;
    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : `https://t.me/${user.telegramId}`);
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: mayNotMatch ? 0.7 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Avatar name={user.name} photoUrl={user.photoUrl} size={50} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
        {mayNotMatch && (
          <View style={styles.mayNotMatchBadge}>
            <Feather name="alert-triangle" size={11} color="#92400E" />
            <Text style={styles.mayNotMatchText}>
              {" "}Может не подойти: не указал готовность к этому типу ухода
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text
            style={[styles.district, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {" "}{user.address || user.district}
          </Text>
        </View>
        <View style={styles.row}>
          <RatingStars rating={user.rating} size={12} />
        </View>
        <HelpStatusBadge status={user.helpStatus} size="sm" />
        {user.otherPets && user.otherPets.length > 0 ? (
          <View style={styles.petsRow}>
            {user.otherPets.map((p, i) => (
              <View
                key={i}
                style={[styles.petBadge, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.petBadgeText, { color: colors.primary }]}>
                  {OTHER_PET_LABELS[p.type]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.telegramBtn, { backgroundColor: colors.primary }]}
        onPress={openTelegram}
        activeOpacity={0.8}
      >
        <Feather name="send" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  info: { flex: 1, gap: 4 },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  row: { flexDirection: "row", alignItems: "center" },
  district: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  petsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  petBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  petBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  telegramBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  mayNotMatchBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    maxWidth: "100%",
  },
  mayNotMatchText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: "Inter_500Medium",
    color: "#92400E",
  },
});
