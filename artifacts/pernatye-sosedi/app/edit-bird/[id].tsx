import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bird,
  BirdAttachment,
  BirdSpecies,
  SIT_LOCATION_ICONS,
  SIT_LOCATION_LABELS,
  SPECIES_LABELS,
  SitLocation,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

const SPECIES_LIST: BirdSpecies[] = [
  "parrot_budgie",
  "parrot_corella",
  "parrot_lovebird",
  "parrot_rosella",
  "parrot_amazon",
  "parrot_jaco",
  "parrot_ara",
  "parrot_kakadu",
  "parrot_eclectus",
  "parrot_alexandrine",
  "parakeet_kakariki",
  "parrot_pyrrhura",
  "canary",
  "finch",
  "pigeon",
  "other",
];

const SIT_LOCATIONS: SitLocation[] = ["drop_off", "at_my_home", "flexible"];

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function EditBirdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds, updateBird } = useApp();

  const bird = birds.find((b) => b.id === id);

  const [species, setSpecies] = useState<BirdSpecies>(bird?.species ?? "parrot_budgie");
  const [name, setName] = useState(bird?.name ?? "");
  const initialTotal = bird?.ageMonths ?? 0;
  const [ageYears, setAgeYears] = useState(
    initialTotal > 0 ? String(Math.floor(initialTotal / 12)) : ""
  );
  const [ageMonthsExtra, setAgeMonthsExtra] = useState(
    initialTotal > 0 ? String(initialTotal % 12) : ""
  );
  const [food, setFood] = useState(bird?.food ?? "");
  const [schedule, setSchedule] = useState(bird?.schedule ?? "");
  const [diseases, setDiseases] = useState((bird?.diseases ?? []).join(", "));
  const [medications, setMedications] = useState(bird?.medications ?? "");
  const [catchNotes, setCatchNotes] = useState(bird?.catchNotes ?? "");
  const [vetNotes, setVetNotes] = useState(bird?.vetNotes ?? "");
  const [sitLocation, setSitLocation] = useState<SitLocation>(bird?.sitLocation ?? "flexible");
  const [vetName, setVetName] = useState(bird?.vetName ?? "");
  const [vetContact, setVetContact] = useState(bird?.vetContact ?? "");
  const [wasExamined, setWasExamined] = useState(bird?.wasExamined ?? false);
  const [isPublic, setIsPublic] = useState<boolean>(bird?.isPublic ?? true);
  const [lastCheckupDate, setLastCheckupDate] = useState(bird?.lastCheckupDate ?? "");
  const [medicationExperience, setMedicationExperience] = useState(bird?.medicationExperience ?? "");
  const [attachments, setAttachments] = useState<BirdAttachment[]>(bird?.attachments ?? []);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(bird?.photoUrl);

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setPhotoUrl(uri);
        await updateBird(bird.id, { photoUrl: uri });
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
      setAttachments((prev) => [...prev, ...newOnes]);
      Haptics.selectionAsync();
    } catch {
      Alert.alert("Ошибка", "Не удалось выбрать файл");
    }
  };

  const removeAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Ошибка", "Введите имя птицы");
      return;
    }
    const years = parseInt(ageYears) || 0;
    const monthsExtra = parseInt(ageMonthsExtra) || 0;
    const totalMonths = years * 12 + monthsExtra;
    const data: Partial<Bird> = {
      species,
      name: name.trim(),
      ageMonths: totalMonths > 0 ? totalMonths : undefined,
      food: food.trim() || "Зерновой корм",
      schedule: schedule.trim() || "Кормить утром и вечером",
      diseases: diseases ? diseases.split(",").map((d) => d.trim()).filter(Boolean) : [],
      medications: medications.trim(),
      catchNotes: catchNotes.trim(),
      vetNotes: vetNotes.trim(),
      sitLocation,
      vetName: vetName.trim() || undefined,
      vetContact: vetContact.trim() || undefined,
      wasExamined,
      isPublic,
      lastCheckupDate: lastCheckupDate.trim() || undefined,
      medicationExperience: medicationExperience.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
      photoUrl,
    };
    await updateBird(bird.id, data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Редактирование</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>Сохранить</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={100}
      >
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.heroPhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}>
                <BirdSpeciesIcon species={species} size={120} rounded={false} style={{ borderRadius: 16 }} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
            {photoUrl ? "Нажми чтобы заменить фото" : "Нажми чтобы добавить фото"}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Вид птицы</Text>
        <View style={styles.speciesGrid}>
          {SPECIES_LIST.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.speciesBtn,
                {
                  backgroundColor: species === s ? colors.primary : colors.card,
                  borderColor: species === s ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSpecies(s);
                Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <BirdSpeciesIcon species={s} size={32} />
              <Text
                style={[
                  styles.speciesBtnLabel,
                  { color: species === s ? "#fff" : colors.foreground },
                ]}
                numberOfLines={2}
              >
                {SPECIES_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Основное</Text>
        <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Имя *"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.ageRow}>
            <TextInput
              style={[
                styles.fieldInput,
                styles.ageInput,
                { color: colors.foreground, borderRightColor: colors.border },
              ]}
              placeholder="Возраст: лет"
              placeholderTextColor={colors.mutedForeground}
              value={ageYears}
              onChangeText={(t) => setAgeYears(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[styles.fieldInput, styles.ageInput, { color: colors.foreground }]}
              placeholder="и месяцев"
              placeholderTextColor={colors.mutedForeground}
              value={ageMonthsExtra}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9]/g, "");
                const num = parseInt(cleaned, 10);
                if (cleaned === "" || (Number.isFinite(num) && num <= 11)) {
                  setAgeMonthsExtra(cleaned);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Карточка ухода</Text>
        <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Чем кормить и как часто"
            placeholderTextColor={colors.mutedForeground}
            value={food}
            onChangeText={setFood}
            multiline
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Режим дня"
            placeholderTextColor={colors.mutedForeground}
            value={schedule}
            onChangeText={setSchedule}
            multiline
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Болезни через запятую"
            placeholderTextColor={colors.mutedForeground}
            value={diseases}
            onChangeText={setDiseases}
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Медикаменты и дозировки"
            placeholderTextColor={colors.mutedForeground}
            value={medications}
            onChangeText={setMedications}
            multiline
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Особенности ловли"
            placeholderTextColor={colors.mutedForeground}
            value={catchNotes}
            onChangeText={setCatchNotes}
            multiline
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground }]}
            placeholder="Ветеринарные нюансы"
            placeholderTextColor={colors.mutedForeground}
            value={vetNotes}
            onChangeText={setVetNotes}
            multiline
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Где удобнее оставлять птицу
        </Text>
        <View style={styles.locationCol}>
          {SIT_LOCATIONS.map((loc) => {
            const active = sitLocation === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSitLocation(loc);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.85}
              >
                <Feather
                  name={SIT_LOCATION_ICONS[loc] as any}
                  size={18}
                  color={active ? "#fff" : colors.primary}
                />
                <Text
                  style={[
                    styles.locationBtnLabel,
                    { color: active ? "#fff" : colors.foreground },
                  ]}
                >
                  {SIT_LOCATION_LABELS[loc]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Приватность
        </Text>
        <View
          style={[
            styles.inputGroup,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                }}
              >
                Показывать птицу другим птичникам
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Другие пользователи смогут видеть карточку птицы
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={(v) => {
                setIsPublic(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Ветеринария
        </Text>
        <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>
              Птица проходила обследование
            </Text>
            <Switch
              value={wasExamined}
              onValueChange={(v) => {
                setWasExamined(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {wasExamined ? (
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
              placeholder="Врач или клиника"
              placeholderTextColor={colors.mutedForeground}
              value={vetName}
              onChangeText={setVetName}
            />
          ) : null}
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Дата последнего осмотра (например, 10.11.2025)"
            placeholderTextColor={colors.mutedForeground}
            value={lastCheckupDate}
            onChangeText={setLastCheckupDate}
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Контакт ветеринара (телефон или Telegram)"
            placeholderTextColor={colors.mutedForeground}
            value={vetContact}
            onChangeText={setVetContact}
          />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground }]}
            placeholder="Опыт дачи препаратов (как и какие давали)"
            placeholderTextColor={colors.mutedForeground}
            value={medicationExperience}
            onChangeText={setMedicationExperience}
            multiline
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Документы и справки
        </Text>
        <View style={styles.attachmentsBlock}>
          {attachments.map((a) => (
            <View
              key={a.id}
              style={[styles.attachmentRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.attachmentIconWrap, { backgroundColor: colors.secondary }]}>
                <Feather
                  name={a.mimeType?.startsWith("image/") ? "image" : "file-text"}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.attachmentName, { color: colors.foreground }]} numberOfLines={1}>
                  {a.name}
                </Text>
                {a.size ? (
                  <Text style={[styles.attachmentMeta, { color: colors.mutedForeground }]}>
                    {formatSize(a.size)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => removeAttachment(a.id)} style={styles.removeBtn}>
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
        </View>
      </KeyboardAwareScrollViewCompat>
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
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 16, gap: 10 },
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
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    marginBottom: 4,
  },
  speciesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  speciesBtn: {
    width: "31%",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    gap: 4,
    minHeight: 78,
    justifyContent: "center",
  },
  speciesBtnLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  inputGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  fieldInput: {
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
    minHeight: 48,
  },
  ageRow: {
    flexDirection: "row",
  },
  ageInput: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  locationCol: {
    gap: 8,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  locationBtnLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  attachmentsBlock: {
    gap: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  attachmentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  attachmentMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingRight: 12,
  },
});
