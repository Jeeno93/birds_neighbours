import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BirdAttachment,
  SIT_LOCATION_ICONS,
  SIT_LOCATION_LABELS,
  SPECIES_LABELS,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

export default function BirdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds, deleteBird, updateBird } = useApp();

  const bird = birds.find((b) => b.id === id);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!bird) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 80 }}>
          Птица не найдена
        </Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Удалить птицу", `Удалить ${bird.name}?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await deleteBird(bird.id);
          router.back();
        },
      },
    ]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        await updateBird(bird.id, { photoUrl: result.assets[0].uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Ошибка", "Не удалось загрузить фото");
    }
  };

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const newOnes: BirdAttachment[] = result.assets.map((a) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: a.name,
        uri: a.uri,
        mimeType: a.mimeType,
        size: a.size,
      }));
      const merged = [...(bird.attachments ?? []), ...newOnes];
      await updateBird(bird.id, { attachments: merged });
      Haptics.selectionAsync();
    } catch {
      Alert.alert("Ошибка", "Не удалось выбрать файл");
    }
  };

  const removeAttachment = async (attId: string) => {
    const next = (bird.attachments ?? []).filter((a) => a.id !== attId);
    await updateBird(bird.id, { attachments: next });
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {bird.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/edit-bird/${bird.id}` as any)}
            style={styles.iconBtn}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            {bird.photoUrl ? (
              <Image source={{ uri: bird.photoUrl }} style={styles.heroPhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}>
                <BirdSpeciesIcon species={bird.species} size={140} rounded={false} style={{ borderRadius: 16 }} />
              </View>
            )}
          </TouchableOpacity>
          {!bird.photoUrl ? (
            <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
              Нажми чтобы добавить фото
            </Text>
          ) : null}
          <Text style={[styles.birdName, { color: colors.foreground }]}>{bird.name}</Text>
          <Text style={[styles.birdSpecies, { color: colors.primary }]}>
            {SPECIES_LABELS[bird.species]}
          </Text>
          {bird.ageMonths ? (
            <Text style={[styles.birdAge, { color: colors.mutedForeground }]}>
              {bird.ageMonths < 12
                ? `${bird.ageMonths} мес.`
                : `${Math.floor(bird.ageMonths / 12)} г. ${bird.ageMonths % 12 ? `${bird.ageMonths % 12} мес.` : ""}`}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Карточка ухода
        </Text>

        {[
          { icon: "coffee", label: "Кормление", value: bird.food },
          { icon: "clock", label: "Режим дня", value: bird.schedule },
          { icon: "activity", label: "Болезни", value: bird.diseases.join(", ") || "Нет" },
          { icon: "droplet", label: "Медикаменты", value: bird.medications || "Нет" },
          { icon: "wind", label: "Особенности ловли", value: bird.catchNotes || "Нет особенностей" },
          { icon: "heart", label: "Ветеринарные нюансы", value: bird.vetNotes || "Нет" },
        ].map((item) => (
          <View
            key={item.label}
            style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          </View>
        ))}

        {bird.sitLocation ? (
          <View
            style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
              <Feather
                name={SIT_LOCATION_ICONS[bird.sitLocation] as any}
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Место присмотра
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {SIT_LOCATION_LABELS[bird.sitLocation]}
              </Text>
            </View>
          </View>
        ) : null}

        {bird.wasExamined ||
        bird.vetName ||
        bird.vetContact ||
        bird.lastCheckupDate ||
        bird.medicationExperience ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ветеринария
            </Text>
            {typeof bird.wasExamined === "boolean" ? (
              <View
                style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather
                    name={bird.wasExamined ? "check-circle" : "x-circle"}
                    size={16}
                    color={bird.wasExamined ? colors.primary : colors.mutedForeground}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Обследование
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {bird.wasExamined ? "Птица проходила обследование" : "Пока не обследовалась"}
                  </Text>
                </View>
              </View>
            ) : null}
            {bird.wasExamined && bird.vetName ? (
              <View
                style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Врач / клиника
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {bird.vetName}
                  </Text>
                </View>
              </View>
            ) : null}
            {bird.lastCheckupDate ? (
              <View
                style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Дата последнего осмотра
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {bird.lastCheckupDate}
                  </Text>
                </View>
              </View>
            ) : null}
            {bird.vetContact ? (
              <TouchableOpacity
                onPress={() => {
                  const contact = bird.vetContact!.trim();
                  if (contact.startsWith("@")) {
                    const handle = contact.slice(1);
                    const tgUrl = `tg://resolve?domain=${handle}`;
                    Linking.canOpenURL(tgUrl).then((supported) => {
                      Linking.openURL(supported ? tgUrl : `https://t.me/${handle}`);
                    });
                  } else if (/^[+\d][\d\s\-()]+$/.test(contact)) {
                    Linking.openURL(`tel:${contact.replace(/[^+\d]/g, "")}`);
                  }
                }}
                style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name="phone" size={16} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Контакт ветеринара
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.primary }]}>
                    {bird.vetContact}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
            {bird.medicationExperience ? (
              <View
                style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name="droplet" size={16} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Опыт дачи препаратов
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {bird.medicationExperience}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Файлы
        </Text>
        <View style={[styles.localFilesNotice, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.localFilesNoticeText, { color: colors.mutedForeground }]}>
            ⚠️ Файлы хранятся локально на устройстве и будут недоступны после переустановки. Облачное хранилище появится в следующей версии.
          </Text>
        </View>
        {(bird.attachments ?? []).map((a) => (
          <View
            key={a.id}
            style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <TouchableOpacity
              onPress={() => Linking.openURL(a.uri).catch(() => {})}
              activeOpacity={0.85}
              style={styles.attachmentTap}
            >
              <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                <Feather
                  name={a.mimeType?.startsWith("image/") ? "image" : "file-text"}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                  {a.name}
                </Text>
                {a.size ? (
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground, marginTop: 2 }]}>
                    {a.size < 1024
                      ? `${a.size} Б`
                      : a.size < 1024 * 1024
                      ? `${(a.size / 1024).toFixed(0)} КБ`
                      : `${(a.size / 1024 / 1024).toFixed(1)} МБ`}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeAttachment(a.id)} style={styles.removeAttBtn}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addAttachBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={pickAttachment}
          activeOpacity={0.85}
        >
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={[styles.addAttachLabel, { color: colors.primary }]}>
            Прикрепить справку или фото
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 8 },
  content: { padding: 16, gap: 12 },
  heroSection: { alignItems: "center", gap: 6, marginBottom: 8 },
  heroPhoto: { width: 120, height: 120, borderRadius: 20 },
  heroPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -2,
  },
  birdName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  birdSpecies: { fontSize: 15, fontFamily: "Inter_500Medium" },
  birdAge: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  localFilesNotice: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  localFilesNoticeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 3 },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  attachmentTap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  removeAttBtn: {
    padding: 6,
    marginLeft: 4,
  },
  addAttachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 14,
    gap: 8,
  },
  addAttachLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
