import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api/client";
import {
  Bird,
  BirdSpecies,
  OTHER_PET_LABELS,
  Review,
  SITTER_CAPABILITY_LABELS,
  SIT_TYPE_SHORT,
  SPECIES_LABELS,
  User,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { Avatar } from "@/components/Avatar";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { useColors } from "@/hooks/useColors";

export default function NeighborProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { neighbors } = useApp();

  // Если сосед уже в кэше списка соседей — рендерим его сразу.
  // Иначе подгружаем профиль через GET /api/users/:id.
  const cached = neighbors.find((n) => n.id === id) ?? null;
  const [neighbor, setNeighbor] = useState<User | null>(cached);
  const [neighborLoading, setNeighborLoading] = useState(!cached);
  const [neighborError, setNeighborError] = useState(false);

  const [userBirds, setUserBirds] = useState<Bird[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  // На каждое изменение id/кэша полностью пересинхронизируем локальный
  // стейт: иначе при возврате к экрану с другим id мог бы остаться
  // прошлый профиль или прошлая ошибка.
  useEffect(() => {
    let cancelled = false;
    setUserBirds([]);
    setUserReviews([]);

    if (!id) {
      setNeighbor(null);
      setNeighborLoading(false);
      setNeighborError(true);
      return;
    }

    if (cached) {
      setNeighbor(cached);
      setNeighborError(false);
      setNeighborLoading(false);
    } else {
      setNeighbor(null);
      setNeighborError(false);
      setNeighborLoading(true);
      (async () => {
        try {
          const data = await apiRequest<User>(`/api/users/${id}`);
          if (cancelled) return;
          if (data?.id) setNeighbor(data);
          else setNeighborError(true);
        } catch {
          if (!cancelled) setNeighborError(true);
        } finally {
          if (!cancelled) setNeighborLoading(false);
        }
      })();
    }

    (async () => {
      try {
        const data = await apiRequest<Bird[]>(
          `/api/birds?userId=${encodeURIComponent(id)}`
        );
        if (!cancelled) setUserBirds(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setUserBirds([]);
      }
    })();
    (async () => {
      try {
        const data = await apiRequest<Review[]>(
          `/api/reviews?toUserId=${encodeURIComponent(id)}`
        );
        if (!cancelled) setUserReviews(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setUserReviews([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, cached]);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (neighborLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!neighbor || neighborError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 80 }}>
          Птичник не найден
        </Text>
      </View>
    );
  }

  const openTelegram = () => {
    const url = `tg://resolve?domain=${neighbor.telegramId}`;
    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : `https://t.me/${neighbor.telegramId}`);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Avatar name={neighbor.name} photoUrl={neighbor.photoUrl} size={80} />
          <Text style={[styles.name, { color: colors.foreground }]}>{neighbor.name}</Text>
          <View style={styles.row}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text
              style={[styles.sub, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {" "}{neighbor.address || neighbor.district}
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="award" size={14} color={colors.mutedForeground} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {" "}{neighbor.experienceYears} {neighbor.experienceYears === 1 ? "год" : neighbor.experienceYears < 5 ? "года" : "лет"} опыта
            </Text>
          </View>
          <RatingStars rating={neighbor.rating} size={15} />
          <HelpStatusBadge status={neighbor.helpStatus} />
          {neighbor.sitTypes && neighbor.sitTypes.length > 0 ? (
            <View style={styles.petsBadgeRow}>
              {neighbor.sitTypes.map((t) => (
                <View
                  key={t}
                  style={[styles.petBadge, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.petBadgeText, { color: colors.primary }]}>
                    {SIT_TYPE_SHORT[t]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {neighbor.otherPets && neighbor.otherPets.length > 0 ? (
            <View style={styles.petsBadgeRow}>
              {neighbor.otherPets.map((p, i) => (
                <View
                  key={i}
                  style={[styles.petBadge, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.petBadgeText, { color: colors.primary }]}>
                    {OTHER_PET_LABELS[p.type]}
                    {p.name ? ` · ${p.name}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.tgBtn, { backgroundColor: colors.primary }]}
            onPress={openTelegram}
            activeOpacity={0.8}
          >
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.tgBtnText}>Написать в Telegram</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Умеет</Text>
          {neighbor.capabilities && neighbor.capabilities.length > 0 ? (
            <View style={styles.capabilitiesRow}>
              {neighbor.capabilities.map((c) => (
                <View
                  key={c}
                  style={[styles.capabilityChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.capabilityText, { color: colors.primary }]}>
                    {SITTER_CAPABILITY_LABELS[c]}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.capabilityHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-circle" size={14} color={colors.mutedForeground} />
              <Text style={[styles.capabilityHintText, { color: colors.mutedForeground }]}>
                {" "}Уточните при общении
              </Text>
            </View>
          )}
        </View>

        {userBirds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Птицы</Text>
            {userBirds.map((bird) => (
              <View
                key={bird.id}
                style={[styles.birdRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <BirdSpeciesIcon species={bird.species as BirdSpecies} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.birdName, { color: colors.foreground }]}>{bird.name}</Text>
                  <Text style={[styles.birdSpecies, { color: colors.mutedForeground }]}>
                    {SPECIES_LABELS[bird.species as keyof typeof SPECIES_LABELS] ?? bird.species}
                  </Text>
                  {bird.wasExamined ? (
                    <View style={styles.birdMetaRow}>
                      <Feather name="check-circle" size={11} color={colors.primary} />
                      <Text style={[styles.birdMeta, { color: colors.mutedForeground }]}>
                        {" "}Обследована
                        {bird.lastCheckupDate ? ` · ${bird.lastCheckupDate}` : ""}
                      </Text>
                    </View>
                  ) : null}
                  {bird.vetName ? (
                    <Text style={[styles.birdMeta, { color: colors.mutedForeground }]}>
                      {bird.vetName}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Отзывы ({userReviews.length})
          </Text>
          {userReviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyReviewsText, { color: colors.mutedForeground }]}>
                Пока нет отзывов
              </Text>
            </View>
          ) : (
            userReviews.map((review) => (
              <View
                key={review.id}
                style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewFrom, { color: colors.foreground }]}>
                    Птичник
                  </Text>
                  <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                  </Text>
                </View>
                {review.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {review.tags.map((tag, j) => (
                      <View key={j} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {review.comment ? (
                  <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  content: { padding: 16, gap: 20 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", alignItems: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tgBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  tgBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  birdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  birdName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  birdSpecies: { fontSize: 12, fontFamily: "Inter_400Regular" },
  birdMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  birdMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  petsBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 },
  petBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyReviews: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyReviewsText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewFrom: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reviewComment: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  capabilitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  capabilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  capabilityText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  capabilityHint: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  capabilityHintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
