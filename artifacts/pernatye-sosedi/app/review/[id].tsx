import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { REVIEW_TAGS, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { currentUser, addReview } = useApp();

  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
    Haptics.selectionAsync();
  };

  const canSubmit =
    !!currentUser && !!id && id !== currentUser.id && rating >= 1 && !saving;

  const handleSubmit = async () => {
    if (!currentUser || !id) {
      Alert.alert("Ошибка", "Профиль не найден");
      return;
    }
    if (id === currentUser.id) {
      Alert.alert("Нельзя", "Нельзя оставить отзыв самому себе");
      return;
    }
    setSaving(true);
    try {
      await addReview({
        toUserId: id,
        rating,
        tags: Array.from(tags),
        comment: comment.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Ошибка", "Не удалось отправить отзыв");
    } finally {
      setSaving(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {name ? `Отзыв о ${name}` : "Оставить отзыв"}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.saveBtn,
            { backgroundColor: canSubmit ? colors.primary : colors.muted },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: canSubmit ? "#fff" : colors.mutedForeground },
            ]}
          >
            {saving ? "…" : "Отправить"}
          </Text>
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
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Оценка</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => {
                setRating(n);
                Haptics.selectionAsync();
              }}
              hitSlop={6}
              activeOpacity={0.7}
            >
              <Feather
                name="star"
                size={38}
                color={n <= rating ? "#f59e0b" : colors.border}
                style={{ opacity: n <= rating ? 1 : 0.6 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>
          Что понравилось (необязательно)
        </Text>
        <View style={styles.tagsWrap}>
          {REVIEW_TAGS.map((tag) => {
            const active = tags.has(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: active ? "#fff" : colors.foreground },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>
          Комментарий (необязательно)
        </Text>
        <TextInput
          style={[
            styles.commentInput,
            { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground },
          ]}
          placeholder="Как прошла передержка?"
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
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
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 20 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  starsRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    textAlignVertical: "top",
  },
});
