import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Bird, SPECIES_LABELS } from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

interface BirdCardProps {
  bird: Bird;
  onPress?: () => void;
  compact?: boolean;
}

export function BirdCard({ bird, onPress, compact = false }: BirdCardProps) {
  const colors = useColors();

  const handlePress = onPress || (() => router.push(`/bird/${bird.id}`));

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <BirdSpeciesIcon species={bird.species} size={36} />
        <View style={styles.compactInfo}>
          <Text style={[styles.birdName, { color: colors.foreground }]}>{bird.name}</Text>
          <Text style={[styles.speciesLabel, { color: colors.mutedForeground }]}>
            {SPECIES_LABELS[bird.species]}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {bird.photoUrl ? (
        <Image source={{ uri: bird.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
          <BirdSpeciesIcon species={bird.species} size={84} rounded={false} style={{ borderRadius: 12 }} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={[styles.birdName, { color: colors.foreground }]}>{bird.name}</Text>
        <Text style={[styles.speciesLabel, { color: colors.primary }]}>
          {SPECIES_LABELS[bird.species]}
        </Text>
        {bird.ageMonths ? (
          <Text style={[styles.age, { color: colors.mutedForeground }]}>
            {bird.ageMonths < 12
              ? `${bird.ageMonths} мес.`
              : `${Math.floor(bird.ageMonths / 12)} г. ${bird.ageMonths % 12 ? `${bird.ageMonths % 12} мес.` : ""}`}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  photo: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bigIcon: { fontSize: 28 },
  speciesIcon: { fontSize: 22, marginRight: 10 },
  cardInfo: { flex: 1 },
  compactInfo: { flex: 1 },
  birdName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  speciesLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  age: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
