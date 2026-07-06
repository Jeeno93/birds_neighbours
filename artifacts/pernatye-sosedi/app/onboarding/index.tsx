import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  SPECIES_LABELS,
  User,
  extractDistrictFromAddress,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";
import { apiRequest } from "@/api/client";
import { consumePickedLocation } from "@/utils/pickedLocation";
import { normalizeTelegramUsername, isValidTelegramUsername } from "@/utils/telegram";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentUser, completeOnboarding, neighbors, currentUser, birds, deleteBird } =
    useApp();

  const [step, setStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Птицы добавляются через переиспользуемый экран /add-bird (богатая форма),
  // поэтому пользователь создаётся заранее (на шаге auth) — чтобы addBird на
  // том экране синкался в БД. Держим созданного юзера в ref, чтобы не ловить
  // stale closure между setCurrentUser и последующим чтением.
  const createdUserRef = useRef<User | null>(null);
  const [experienceYears] = useState("2");
  const [helpStatus] = useState<"ready" | "sometimes" | "not_now">("ready");
  const [userName, setUserName] = useState("Александр");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [tgError, setTgError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // При возврате с экрана выбора места — подхватываем выбранные координаты.
  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedLocation();
      if (picked) {
        setLat(picked.lat);
        setLng(picked.lng);
        if (picked.address) setAddress(picked.address);
        if (picked.city) setCity(picked.city);
        setLocationConfirmed(true);
      }
    }, [])
  );

  const totalSteps = 5;

  // Создаёт пользователя (find-or-create по telegramId) и кладёт в контекст+ref.
  // Вызывается при уходе с шага auth, чтобы к шагу «Птицы» уже был currentUser
  // с валидным UUID (иначе addBird на экране /add-bird не синкнулся бы в БД).
  const ensureUser = async (): Promise<User> => {
    if (createdUserRef.current) return createdUserRef.current;
    const telegramId = normalizeTelegramUsername(telegramUsername);
    let user: User;
    try {
      user = await apiRequest<User>("/api/users/auth", {
        method: "POST",
        body: JSON.stringify({ telegramId, name: userName.trim() }),
      });
    } catch {
      // API недоступен — локальный (не-UUID) id, оффлайн-режим.
      user = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        telegramId,
        name: userName.trim(),
        city: "Москва",
        district: "Москва",
        experienceYears: 2,
        helpStatus: "ready",
        sitTypes: [],
        capabilities: [],
        otherPets: [],
        rating: 0,
        reviewsCount: 0,
        createdAt: new Date().toISOString(),
      } as User;
    }
    createdUserRef.current = user;
    await setCurrentUser(user);
    return user;
  };

  const goNext = async () => {
    // Шаг «auth» (индекс 1): имя и валидный Telegram-username обязательны —
    // контакт через Telegram это ядро продукта, битый хендл ломает весь поток.
    if (step === 1) {
      if (!userName.trim()) {
        setTgError("Введите ваше имя");
        return;
      }
      const handle = normalizeTelegramUsername(telegramUsername);
      if (!isValidTelegramUsername(handle)) {
        setTgError(
          "Укажите Telegram-username: 5–32 символа, латиница/цифры/_, без @ и email"
        );
        return;
      }
      setTgError(null);
      // Создаём пользователя до шага птиц (чтобы /add-bird синкал в БД).
      await ensureUser();
    }
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
    // Пользователь уже создан на шаге auth; здесь только дополняем профиль
    // локацией/опытом и завершаем онбординг. Птицы уже сохранены через экран
    // /add-bird. Юзера берём из ref (не из stale-замыкания currentUser).
    const base = createdUserRef.current ?? (await ensureUser());
    const derivedDistrict =
      extractDistrictFromAddress(address) || base.district || "Москва";
    const updated: User = {
      ...base,
      name: userName.trim() || base.name,
      city: city || base.city || "Москва",
      district: derivedDistrict,
      address: address || base.address,
      lat: lat ?? base.lat,
      lng: lng ?? base.lng,
      experienceYears: parseInt(experienceYears) || base.experienceYears || 2,
      helpStatus,
    };

    if (address) {
      try {
        await AsyncStorage.setItem("@pernatye_address", address);
      } catch {
        // ignore — адрес вспомогательное поле
      }
    }

    await setCurrentUser(updated);
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
              style={[
                styles.input,
                {
                  borderColor: tgError ? "#e5484d" : colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="username (без @)"
              placeholderTextColor={colors.mutedForeground}
              value={telegramUsername}
              onChangeText={(t) => {
                setTelegramUsername(t);
                if (tgError) setTgError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {tgError && (
              <Text style={[styles.tgError, { color: "#e5484d" }]}>{tgError}</Text>
            )}
            <View style={styles.tgNote}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.tgNoteText, { color: colors.mutedForeground }]}>
                {" "}По username соседи напишут вам в Telegram
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
          >
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Мои птицы
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
              Добавьте птиц или пропустите — это можно сделать позже
            </Text>

            {birds.length > 0 && (
              <View style={{ width: "100%", marginBottom: 12 }}>
                {birds.map((b) => (
                  <View
                    key={b.id}
                    style={[
                      styles.birdCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    {b.photoUrl ? (
                      <Image source={{ uri: b.photoUrl }} style={styles.birdCardPhoto} />
                    ) : (
                      <BirdSpeciesIcon species={b.species} size={36} />
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 15,
                        }}
                      >
                        {b.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        {SPECIES_LABELS[b.species]}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteBird(b.id)}
                      style={styles.birdCardRemove}
                      hitSlop={8}
                    >
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={{
                alignSelf: "stretch",
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.primary,
                alignItems: "center",
                marginTop: 4,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/add-bird");
              }}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 15,
                }}
              >
                {birds.length > 0 ? "Добавить ещё птицу" : "Добавить птицу"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case "profile":
        return (
          <View
            style={{
              width,
              flex: 1,
              paddingTop: topPad + 12,
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Где вы находитесь?
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_500Medium",
                fontSize: 15,
                textAlign: "center",
                marginBottom: 10,
                minHeight: 40,
              }}
              numberOfLines={2}
            >
              {address || "Откройте карту и выберите место"}
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Адрес
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                  marginBottom: 12,
                }}
                numberOfLines={3}
              >
                {address || "Не указано"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({
                    pathname: "/pick-location",
                    params: {
                      ...(lat !== undefined ? { initialLat: String(lat) } : {}),
                      ...(lng !== undefined ? { initialLng: String(lng) } : {}),
                    },
                  });
                }}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                }}
              >
                <Feather name="map" size={16} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                  }}
                >
                  {locationConfirmed ? "✓ Изменить на карте" : "Выбрать на карте"}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                Город:
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Москва"
                placeholderTextColor={colors.mutedForeground}
                style={{
                  flex: 1,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 4,
                }}
              />
            </View>
          </View>
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
                {neighbors.length > 0
                  ? `${neighbors.length} птичников уже в сообществе`
                  : "Стань одним из первых птичников"}
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
                {neighbors.length > 0
                  ? "После регистрации ты увидишь их на карте"
                  : "Скоро рядом появятся соседи — и ты поможешь им первым"}
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

  // Шаги 2 (Птицы) и 3 (Профиль) — опциональны, можно пропустить.
  const canSkip = step >= 2 && step < totalSteps - 1;

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
          <TouchableOpacity
            onPress={() => {
              goNext();
            }}
            style={styles.skipBtn}
          >
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
  birdCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  birdCardPhoto: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  birdCardRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
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
  tgError: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    alignSelf: "flex-start",
    marginTop: 6,
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
