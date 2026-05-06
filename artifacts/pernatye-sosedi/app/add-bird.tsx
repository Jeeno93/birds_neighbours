import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
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

export default function AddBirdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBird, currentUser } = useApp();

  const [species, setSpecies] = useState<BirdSpecies>("parrot_budgie");
  const [name, setName] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [food, setFood] = useState("");
  const [schedule, setSchedule] = useState("");
  const [diseases, setDiseases] = useState("");
  const [medications, setMedications] = useState("");
  const [catchNotes, setCatchNotes] = useState("");
  const [vetNotes, setVetNotes] = useState("");
  const [sitLocation, setSitLocation] = useState<SitLocation>("flexible");
  const [vetName, setVetName] = useState("");
  const [vetContact, setVetContact] = useState("");
  const [wasExamined, setWasExamined] = useState(false);
  const [lastCheckupDate, setLastCheckupDate] = useState("");
  const [medicationExperience, setMedicationExperience] = useState("");
  const [attachments, setAttachments] = useState<BirdAttachment[]>([]);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

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

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Ошибка", "Введите имя птицы");
      return;
    }
    const bird: Bird = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id ?? "me",
      species,
      name: name.trim(),
      ageMonths: ageMonths ? parseInt(ageMonths) : undefined,
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
      lastCheckupDate: lastCheckupDate.trim() || undefined,
      medicationExperience: medicationExperience.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
      createdAt: new Date().toISOString(),
    };
    await addBird(bird);
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Добавить птицу</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>Сохранить</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground }]}
            placeholder="Возраст (в месяцах)"
            placeholderTextColor={colors.mutedForeground}
            value={ageMonths}
            onChangeText={setAgeMonths}
            keyboardType="number-pad"
          />
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
