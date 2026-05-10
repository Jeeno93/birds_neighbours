import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bird,
  BirdSpecies,
  MOSCOW_DISTRICTS,
  SIT_LOCATION_ICONS,
  SIT_LOCATION_LABELS,
  SPECIES_LABELS,
  SitLocation,
  User,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import NativeMap, { MarkerData } from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";
import { apiRequest } from "@/api/client";

const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6173 };

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY;
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;
    const res = await fetch(url);
    const data = await res.json();
    return (
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
        ?.metaDataProperty?.GeocoderMetaData?.text ?? ""
    );
  } catch {
    return "";
  }
}

const { width } = Dimensions.get("window");

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

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentUser, addBird, completeOnboarding, neighbors } = useApp();

  const [step, setStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [selectedSpecies, setSelectedSpecies] = useState<BirdSpecies>("parrot_budgie");
  const [birdName, setBirdName] = useState("");
  const [food, setFood] = useState("");
  const [schedule, setSchedule] = useState("");
  const [diseases, setDiseases] = useState("");
  const [medications, setMedications] = useState("");
  const [catchNotes, setCatchNotes] = useState("");
  const [vetNotes, setVetNotes] = useState("");
  const [sitLocation, setSitLocation] = useState<SitLocation>("flexible");
  const [district, setDistrict] = useState("Арбат");
  const [experienceYears, setExperienceYears] = useState("2");
  const [helpStatus, setHelpStatus] = useState<"ready" | "sometimes" | "not_now">("ready");
  const [userName, setUserName] = useState("Александр");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationTriggered, setLocationTriggered] = useState(false);

  const geocodeReqRef = useRef(0);
  const updateMarker = async (latValue: number, lngValue: number) => {
    setLat(latValue);
    setLng(lngValue);
    setLocationConfirmed(false);
    setAddressLoading(true);
    const reqId = ++geocodeReqRef.current;
    const text = await reverseGeocode(latValue, lngValue);
    if (reqId !== geocodeReqRef.current) return; // устаревший ответ
    setAddress(text);
    setAddressLoading(false);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        await updateMarker(location.coords.latitude, location.coords.longitude);
      } else {
        await updateMarker(MOSCOW_CENTER.latitude, MOSCOW_CENTER.longitude);
      }
    } catch {
      await updateMarker(MOSCOW_CENTER.latitude, MOSCOW_CENTER.longitude);
    }
  };

  useEffect(() => {
    if (step === 4 && !locationTriggered) {
      setLocationTriggered(true);
      getLocation();
    }
  }, [step, locationTriggered]);

  const totalSteps = 6;

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < totalSteps - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      Animated.timing(progressAnim, {
        toValue: nextStep / (totalSteps - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      finish();
    }
  };

  const finish = async () => {
    const tgUsername = telegramUsername.trim().replace(/^@/, "");
    const telegramId = tgUsername || "tg_" + Date.now();

    let userId: string;
    let baseUser: Partial<User>;

    try {
      // POST /api/users/auth — на успехе используем ТОЛЬКО api user.id (UUID).
      const apiUser = await apiRequest<User>("/api/users/auth", {
        method: "POST",
        body: JSON.stringify({ telegramId, name: userName }),
      });
      userId = apiUser.id;
      baseUser = apiUser;
    } catch {
      // API недоступен — fallback к локальному id (НЕ-UUID, помечает оффлайн-режим).
      userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      baseUser = {
        id: userId,
        telegramId,
        rating: 0,
        createdAt: new Date().toISOString(),
      };
    }

    const user: User = {
      ...(baseUser as User),
      id: userId,
      telegramId: baseUser.telegramId ?? telegramId,
      name: userName,
      district,
      lat: lat ?? baseUser.lat,
      lng: lng ?? baseUser.lng,
      experienceYears: parseInt(experienceYears) || 2,
      helpStatus,
      rating: baseUser.rating ?? 0,
      createdAt: baseUser.createdAt ?? new Date().toISOString(),
    };

    if (address) {
      try {
        await AsyncStorage.setItem("@pernatye_address", address);
      } catch {
        // ignore — адрес — вспомогательное поле
      }
    }

    const birdId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const bird: Bird = {
      id: birdId,
      userId,
      species: selectedSpecies,
      name: birdName || "Моя птица",
      ageMonths: undefined,
      food: food || "Специальный корм для вида",
      schedule: schedule || "Кормить утром и вечером",
      diseases: diseases ? diseases.split(",").map((d) => d.trim()) : [],
      medications: medications || "",
      catchNotes: catchNotes || "",
      vetNotes: vetNotes || "",
      sitLocation,
      createdAt: new Date().toISOString(),
    };

    await setCurrentUser(user);
    await addBird(bird);
    await completeOnboarding();
    router.replace("/(tabs)/map");
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const topPad =
    Platform.OS === "web" ? insets.top + 67 : insets.top;

  const screens = [
    { key: "welcome" },
    { key: "auth" },
    { key: "bird" },
    { key: "care" },
    { key: "profile" },
    { key: "map" },
  ];

  const renderScreen = ({ item }: { item: { key: string } }) => {
    switch (item.key) {
      case "welcome":
        return (
          <View style={[styles.slide, { paddingTop: topPad + 20 }]}>
            <Image
              source={require("@/assets/images/onboarding-welcome.png")}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
            <View style={styles.welcomeText}>
              <Text style={[styles.bigTitle, { color: colors.foreground }]}>
                Пернатые соседи
              </Text>
              <Text style={[styles.slogan, { color: colors.mutedForeground }]}>
                Твои птицы в надёжных руках,{"\n"}пока ты путешествуешь
              </Text>
            </View>
          </View>
        );

      case "auth":
        return (
          <View style={[styles.slide, { paddingTop: topPad + 40 }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
              <Text style={{ fontSize: 52 }}>🐦</Text>
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Войти через Telegram
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
              Сообщество птичников уже живёт в Telegram — один вход без паролей и почты
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Ваше имя"
              placeholderTextColor={colors.mutedForeground}
              value={userName}
              onChangeText={setUserName}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="username"
              placeholderTextColor={colors.mutedForeground}
              value={telegramUsername}
              onChangeText={setTelegramUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.tgNote}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.tgNoteText, { color: colors.mutedForeground }]}>
                {" "}Данные защищены и не передаются третьим лицам
              </Text>
            </View>
          </View>
        );

      case "bird":
        return (
          <ScrollView
            style={{ width }}
            contentContainerStyle={{ width, paddingTop: topPad + 20, paddingHorizontal: 24, paddingBottom: 24, alignItems: "center", flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Моя птица
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
              Выберите вид и введите имя
            </Text>
            <View style={styles.speciesGrid}>
              {SPECIES_LIST.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speciesBtn,
                    {
                      backgroundColor:
                        selectedSpecies === s ? colors.primary : colors.card,
                      borderColor:
                        selectedSpecies === s ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSpecies(s);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <BirdSpeciesIcon species={s} size={32} />
                  <Text
                    style={[
                      styles.speciesBtnLabel,
                      {
                        color:
                          selectedSpecies === s
                            ? "#fff"
                            : colors.foreground,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {SPECIES_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Имя птицы"
              placeholderTextColor={colors.mutedForeground}
              value={birdName}
              onChangeText={setBirdName}
            />
          </ScrollView>
        );

      case "care":
        return (
          <ScrollView
            style={{ width }}
            contentContainerStyle={{ width, paddingTop: topPad + 20, paddingHorizontal: 24, paddingBottom: 24, alignItems: "center", flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Карточка ухода
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
              Эту информацию прочитает тот, кто будет присматривать
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Чем кормить (корм, порция)"
              placeholderTextColor={colors.mutedForeground}
              value={food}
              onChangeText={setFood}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Режим дня (сон, активность)"
              placeholderTextColor={colors.mutedForeground}
              value={schedule}
              onChangeText={setSchedule}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Болезни через запятую"
              placeholderTextColor={colors.mutedForeground}
              value={diseases}
              onChangeText={setDiseases}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Особенности ловли (если летает)"
              placeholderTextColor={colors.mutedForeground}
              value={catchNotes}
              onChangeText={setCatchNotes}
            />
            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 4 }]}>
              Где удобнее оставлять птицу
            </Text>
            <View style={styles.sitLocationCol}>
              {SIT_LOCATIONS.map((loc) => {
                const active = sitLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.sitLocBtn,
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
                      size={16}
                      color={active ? "#fff" : colors.primary}
                    />
                    <Text
                      style={[
                        styles.sitLocBtnLabel,
                        { color: active ? "#fff" : colors.foreground },
                      ]}
                    >
                      {SIT_LOCATION_LABELS[loc]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Ветеринара и справки можно добавить позже в карточке птицы
            </Text>
          </ScrollView>
        );

      case "profile":
        return (
          <ScrollView
            style={{ width }}
            contentContainerStyle={{ width, paddingTop: topPad + 20, paddingHorizontal: 24, paddingBottom: 24, alignItems: "center", flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Профиль птичника
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
              Расскажите о себе — это поможет найти вас соседям
            </Text>
            <View
              style={{
                width: "100%",
                height: 220,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <NativeMap
                region={{
                  latitude: lat ?? MOSCOW_CENTER.latitude,
                  longitude: lng ?? MOSCOW_CENTER.longitude,
                }}
                zoom={14}
                onMapPress={({ latitude, longitude }) =>
                  updateMarker(latitude, longitude)
                }
                markers={
                  lat !== undefined && lng !== undefined
                    ? ([
                        {
                          id: "me",
                          latitude: lat,
                          longitude: lng,
                          title: "Ваше место",
                          markerColor: colors.primary,
                          draggable: true,
                        },
                      ] as MarkerData[])
                    : []
                }
              />
            </View>
            <Text
              style={{
                width: "100%",
                color: colors.foreground,
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {addressLoading
                ? "Определяем адрес…"
                : address || "Нажмите на карту, чтобы выбрать место"}
            </Text>
            {lat !== undefined && lng !== undefined && (
              <TouchableOpacity
                style={{
                  alignSelf: "stretch",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  marginBottom: 12,
                  backgroundColor: locationConfirmed
                    ? colors.secondary
                    : colors.primary,
                }}
                onPress={() => {
                  setLocationConfirmed(true);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    color: locationConfirmed ? colors.foreground : "#fff",
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                  }}
                >
                  {locationConfirmed ? "✓ Место сохранено" : "Использовать это место"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setShowDistricts(!showDistricts)}
            >
              <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}>
                {district}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showDistricts && (
              <View style={[styles.districtList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {MOSCOW_DISTRICTS.slice(0, 12).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.districtItem, { borderBottomColor: colors.border }]}
                    onPress={() => { setDistrict(d); setShowDistricts(false); }}
                  >
                    <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Лет опыта с птицами"
              placeholderTextColor={colors.mutedForeground}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
            />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Готовность помогать
            </Text>
            <View style={styles.statusRow}>
              {(["ready", "sometimes", "not_now"] as const).map((s) => {
                const labels = { ready: "Готов", sometimes: "Иногда", not_now: "Пока нет" };
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusBtn,
                      {
                        backgroundColor: helpStatus === s ? colors.primary : colors.card,
                        borderColor: helpStatus === s ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setHelpStatus(s); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.statusBtnLabel,
                        { color: helpStatus === s ? "#fff" : colors.foreground },
                      ]}
                    >
                      {labels[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );

      case "map":
        return (
          <View style={[styles.slide, { paddingTop: topPad + 20 }]}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.secondary,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 320,
                marginHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 64 }}>🗺️</Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 20,
                  fontWeight: "600",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                20 птичников в Москве
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 14,
                  marginTop: 8,
                  textAlign: "center",
                  paddingHorizontal: 32,
                }}
              >
                После регистрации ты увидишь их на карте
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const btnLabel =
    step === totalSteps - 1
      ? "Открыть карту"
      : step === 0
      ? "Начать"
      : "Далее";

  const canSkip = step >= 3 && step < totalSteps - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.progressFill, { backgroundColor: colors.primary, width: progressWidth }]}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderScreen}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
      >
        {canSkip && (
          <TouchableOpacity onPress={goNext} style={styles.skipBtn}>
            <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>
              Пропустить
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaLabel}>{btnLabel}</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: {
    height: 3,
    marginHorizontal: 0,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  flatList: { flex: 1 },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  welcomeImage: {
    width: width - 80,
    height: 260,
    marginBottom: 24,
  },
  welcomeText: { alignItems: "center" },
  bigTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  slogan: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speciesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  speciesBtn: {
    width: (width - 72) / 3,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  speciesBtnLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  tgNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tgNoteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  statusBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sitLocationCol: {
    width: "100%",
    gap: 8,
    marginBottom: 8,
  },
  sitLocBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  sitLocBtnLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  wowText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 12,
  },
  mapPreview: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    gap: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  counterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    alignItems: "center",
  },
  skipBtn: { padding: 8 },
  skipLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    width: "100%",
  },
  ctaLabel: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  districtList: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    maxHeight: 200,
  },
  districtItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
});
