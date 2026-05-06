import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type HelpStatus = "ready" | "sometimes" | "not_now";

export type BirdSpecies =
  | "parrot_budgie"
  | "parrot_corella"
  | "parrot_lovebird"
  | "parrot_rosella"
  | "parrot_amazon"
  | "parrot_jaco"
  | "parrot_ara"
  | "parrot_kakadu"
  | "parrot_eclectus"
  | "parrot_alexandrine"
  | "parakeet_kakariki"
  | "parrot_pyrrhura"
  | "canary"
  | "finch"
  | "pigeon"
  | "other";

export type OtherPetType =
  | "dog"
  | "cat"
  | "rodent"
  | "reptile"
  | "fish"
  | "other";

export interface OtherPet {
  type: OtherPetType;
  name?: string;
}

export type SitLocation = "drop_off" | "at_my_home" | "flexible";

export interface BirdAttachment {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export interface Bird {
  id: string;
  userId: string;
  species: BirdSpecies;
  name: string;
  photoUrl?: string;
  ageMonths?: number;
  food: string;
  schedule: string;
  diseases: string[];
  medications: string;
  catchNotes: string;
  vetNotes: string;
  sitLocation?: SitLocation;
  vetName?: string;
  vetContact?: string;
  attachments?: BirdAttachment[];
  wasExamined?: boolean;
  lastCheckupDate?: string;
  medicationExperience?: string;
  createdAt: string;
}

export interface User {
  id: string;
  telegramId: string;
  name: string;
  photoUrl?: string;
  district: string;
  lat?: number;
  lng?: number;
  experienceYears: number;
  helpStatus: HelpStatus;
  rating: number;
  otherPets?: OtherPet[];
  createdAt: string;
}

export interface SitRequest {
  id: string;
  userId: string;
  birdId: string;
  dateFrom: string;
  dateTo: string;
  district: string;
  comment: string;
  status: "open" | "matched" | "closed";
  createdAt: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  tags: string[];
  comment: string;
  createdAt: string;
}

interface AppContextType {
  currentUser: User | null;
  birds: Bird[];
  sitRequests: SitRequest[];
  reviews: Review[];
  neighbors: User[];
  isOnboarded: boolean;
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  addBird: (bird: Bird) => void;
  updateBird: (bird: Bird) => void;
  deleteBird: (id: string) => void;
  addSitRequest: (request: SitRequest) => void;
  addReview: (review: Review) => void;
  completeOnboarding: () => void;
  updateHelpStatus: (status: HelpStatus) => void;
  updateOtherPets: (pets: OtherPet[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  user: "@pernatye_user",
  birds: "@pernatye_birds",
  sitRequests: "@pernatye_sit_requests",
  reviews: "@pernatye_reviews",
  onboarded: "@pernatye_onboarded",
};

const MOCK_NEIGHBORS: User[] = [
  {
    id: "n1",
    telegramId: "101",
    name: "Алексей Морозов",
    photoUrl: undefined,
    district: "Замоскворечье",
    lat: 55.734,
    lng: 37.628,
    experienceYears: 5,
    helpStatus: "ready",
    rating: 4.8,
    otherPets: [{ type: "cat" }],
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "n2",
    telegramId: "102",
    name: "Марина Соколова",
    photoUrl: undefined,
    district: "Арбат",
    lat: 55.748,
    lng: 37.593,
    experienceYears: 3,
    helpStatus: "ready",
    rating: 4.9,
    otherPets: [],
    createdAt: "2024-02-20T10:00:00Z",
  },
  {
    id: "n3",
    telegramId: "103",
    name: "Дмитрий Лебедев",
    photoUrl: undefined,
    district: "Хамовники",
    lat: 55.727,
    lng: 37.567,
    experienceYears: 8,
    helpStatus: "sometimes",
    rating: 4.6,
    otherPets: [{ type: "dog", name: "Барон" }],
    createdAt: "2023-11-10T10:00:00Z",
  },
  {
    id: "n4",
    telegramId: "104",
    name: "Екатерина Птицына",
    photoUrl: undefined,
    district: "Пресненский",
    lat: 55.759,
    lng: 37.577,
    experienceYears: 2,
    helpStatus: "ready",
    rating: 4.7,
    otherPets: [],
    createdAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "n5",
    telegramId: "105",
    name: "Ирина Воробьёва",
    photoUrl: undefined,
    district: "Таганский",
    lat: 55.741,
    lng: 37.65,
    experienceYears: 6,
    helpStatus: "ready",
    rating: 5.0,
    otherPets: [],
    createdAt: "2023-08-01T10:00:00Z",
  },
  {
    id: "n6",
    telegramId: "106",
    name: "Сергей Канарейкин",
    photoUrl: undefined,
    district: "Басманный",
    lat: 55.762,
    lng: 37.661,
    experienceYears: 4,
    helpStatus: "sometimes",
    rating: 4.4,
    otherPets: [],
    createdAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "n7",
    telegramId: "107",
    name: "Ольга Журавлёва",
    district: "Бабушкинский",
    lat: 55.866,
    lng: 37.665,
    experienceYears: 7,
    helpStatus: "ready",
    rating: 4.9,
    otherPets: [],
    createdAt: "2023-09-12T10:00:00Z",
  },
  {
    id: "n8",
    telegramId: "108",
    name: "Андрей Стрижов",
    district: "Сокол",
    lat: 55.806,
    lng: 37.515,
    experienceYears: 10,
    helpStatus: "ready",
    rating: 4.8,
    otherPets: [{ type: "dog", name: "Лорд" }],
    createdAt: "2022-05-18T10:00:00Z",
  },
  {
    id: "n9",
    telegramId: "109",
    name: "Татьяна Голубева",
    district: "Бибирево",
    lat: 55.881,
    lng: 37.605,
    experienceYears: 3,
    helpStatus: "ready",
    rating: 4.7,
    otherPets: [],
    createdAt: "2024-04-02T10:00:00Z",
  },
  {
    id: "n10",
    telegramId: "110",
    name: "Игорь Снегирёв",
    district: "Отрадное",
    lat: 55.864,
    lng: 37.604,
    experienceYears: 6,
    helpStatus: "sometimes",
    rating: 4.5,
    otherPets: [],
    createdAt: "2023-07-22T10:00:00Z",
  },
  {
    id: "n11",
    telegramId: "111",
    name: "Наталья Ласточкина",
    district: "Чертаново Северное",
    lat: 55.628,
    lng: 37.61,
    experienceYears: 5,
    helpStatus: "ready",
    rating: 4.9,
    otherPets: [{ type: "cat", name: "Муся" }],
    createdAt: "2023-03-14T10:00:00Z",
  },
  {
    id: "n12",
    telegramId: "112",
    name: "Михаил Орлов",
    district: "Зюзино",
    lat: 55.66,
    lng: 37.598,
    experienceYears: 12,
    helpStatus: "ready",
    rating: 5.0,
    otherPets: [],
    createdAt: "2021-11-30T10:00:00Z",
  },
  {
    id: "n13",
    telegramId: "113",
    name: "Полина Чайкина",
    district: "Южное Бутово",
    lat: 55.541,
    lng: 37.547,
    experienceYears: 1,
    helpStatus: "not_now",
    rating: 4.3,
    otherPets: [],
    createdAt: "2025-01-08T10:00:00Z",
  },
  {
    id: "n14",
    telegramId: "114",
    name: "Евгений Скворцов",
    district: "Ясенево",
    lat: 55.604,
    lng: 37.53,
    experienceYears: 9,
    helpStatus: "ready",
    rating: 4.8,
    otherPets: [{ type: "dog", name: "Граф" }],
    createdAt: "2022-08-19T10:00:00Z",
  },
  {
    id: "n15",
    telegramId: "115",
    name: "Юлия Зябликова",
    district: "Измайлово",
    lat: 55.792,
    lng: 37.77,
    experienceYears: 4,
    helpStatus: "sometimes",
    rating: 4.6,
    otherPets: [],
    createdAt: "2024-02-11T10:00:00Z",
  },
  {
    id: "n16",
    telegramId: "116",
    name: "Артём Дятлов",
    district: "Перово",
    lat: 55.751,
    lng: 37.778,
    experienceYears: 8,
    helpStatus: "ready",
    rating: 4.9,
    otherPets: [],
    createdAt: "2022-12-05T10:00:00Z",
  },
  {
    id: "n17",
    telegramId: "117",
    name: "Светлана Соловьёва",
    district: "Кунцево",
    lat: 55.736,
    lng: 37.434,
    experienceYears: 11,
    helpStatus: "ready",
    rating: 5.0,
    otherPets: [],
    createdAt: "2021-06-25T10:00:00Z",
  },
  {
    id: "n18",
    telegramId: "118",
    name: "Виктор Грачёв",
    district: "Раменки",
    lat: 55.706,
    lng: 37.49,
    experienceYears: 2,
    helpStatus: "not_now",
    rating: 4.2,
    otherPets: [],
    createdAt: "2024-09-17T10:00:00Z",
  },
  {
    id: "n19",
    telegramId: "119",
    name: "Анна Иволгина",
    district: "Митино",
    lat: 55.844,
    lng: 37.358,
    experienceYears: 6,
    helpStatus: "sometimes",
    rating: 4.7,
    otherPets: [{ type: "cat", name: "Пушок" }],
    createdAt: "2023-05-29T10:00:00Z",
  },
  {
    id: "n20",
    telegramId: "120",
    name: "Кирилл Филин",
    district: "Тропарёво-Никулино",
    lat: 55.659,
    lng: 37.487,
    experienceYears: 3,
    helpStatus: "not_now",
    rating: 4.4,
    otherPets: [],
    createdAt: "2024-06-14T10:00:00Z",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [sitRequests, setSitRequests] = useState<SitRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userStr, birdsStr, requestsStr, reviewsStr, onboardedStr] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.birds),
          AsyncStorage.getItem(STORAGE_KEYS.sitRequests),
          AsyncStorage.getItem(STORAGE_KEYS.reviews),
          AsyncStorage.getItem(STORAGE_KEYS.onboarded),
        ]);
      if (userStr) setCurrentUserState(JSON.parse(userStr));
      if (birdsStr) setBirds(JSON.parse(birdsStr));
      if (requestsStr) setSitRequests(JSON.parse(requestsStr));
      if (reviewsStr) setReviews(JSON.parse(reviewsStr));
      if (onboardedStr) setIsOnboarded(JSON.parse(onboardedStr));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const setCurrentUser = useCallback(async (user: User) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }, []);

  const addBird = useCallback(async (bird: Bird) => {
    setBirds((prev) => {
      const next = [...prev, bird];
      AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateBird = useCallback(async (bird: Bird) => {
    setBirds((prev) => {
      const next = prev.map((b) => (b.id === bird.id ? bird : b));
      AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteBird = useCallback(async (id: string) => {
    setBirds((prev) => {
      const next = prev.filter((b) => b.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
      return next;
    });
  }, []);

  const addSitRequest = useCallback(async (request: SitRequest) => {
    setSitRequests((prev) => {
      const next = [...prev, request];
      AsyncStorage.setItem(STORAGE_KEYS.sitRequests, JSON.stringify(next));
      return next;
    });
  }, []);

  const addReview = useCallback(async (review: Review) => {
    setReviews((prev) => {
      const next = [...prev, review];
      AsyncStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.onboarded, JSON.stringify(true));
  }, []);

  const updateHelpStatus = useCallback(
    async (status: HelpStatus) => {
      if (!currentUser) return;
      const updated = { ...currentUser, helpStatus: status };
      setCurrentUser(updated);
    },
    [currentUser, setCurrentUser]
  );

  const updateOtherPets = useCallback(
    async (pets: OtherPet[]) => {
      if (!currentUser) return;
      const updated = { ...currentUser, otherPets: pets };
      setCurrentUser(updated);
    },
    [currentUser, setCurrentUser]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        birds,
        sitRequests,
        reviews,
        neighbors: MOCK_NEIGHBORS,
        isOnboarded,
        isLoading,
        setCurrentUser,
        addBird,
        updateBird,
        deleteBird,
        addSitRequest,
        addReview,
        completeOnboarding,
        updateHelpStatus,
        updateOtherPets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const SPECIES_LABELS: Record<BirdSpecies, string> = {
  parrot_budgie: "Волнистый попугай",
  parrot_corella: "Корелла",
  parrot_lovebird: "Неразлучник",
  parrot_rosella: "Розелла",
  parrot_amazon: "Амазон",
  parrot_jaco: "Жако",
  parrot_ara: "Ара",
  parrot_kakadu: "Какаду",
  parrot_eclectus: "Эклектус",
  parrot_alexandrine: "Александрийский",
  parakeet_kakariki: "Какарики",
  parrot_pyrrhura: "Пиррура",
  canary: "Канарейка",
  finch: "Амадин",
  pigeon: "Голубь",
  other: "Другой вид",
};

export const SPECIES_ICONS: Record<BirdSpecies, string> = {
  parrot_budgie: "🐦",
  parrot_corella: "🦜",
  parrot_lovebird: "🦜",
  parrot_rosella: "🦜",
  parrot_amazon: "🦜",
  parrot_jaco: "🦜",
  parrot_ara: "🦜",
  parrot_kakadu: "🦜",
  parrot_eclectus: "🦜",
  parrot_alexandrine: "🦜",
  parakeet_kakariki: "🦜",
  parrot_pyrrhura: "🦜",
  canary: "🐤",
  finch: "🐥",
  pigeon: "🕊️",
  other: "🪶",
};

export const SPECIES_IMAGES: Record<BirdSpecies, number> = {
  parrot_budgie: require("@/assets/images/birds/parrot_budgie.png"),
  parrot_corella: require("@/assets/images/birds/parrot_corella.png"),
  parrot_lovebird: require("@/assets/images/birds/parrot_lovebird.png"),
  parrot_rosella: require("@/assets/images/birds/parrot_rosella.png"),
  parrot_amazon: require("@/assets/images/birds/parrot_amazon.png"),
  parrot_jaco: require("@/assets/images/birds/parrot_jaco.png"),
  parrot_ara: require("@/assets/images/birds/parrot_ara.png"),
  parrot_kakadu: require("@/assets/images/birds/parrot_kakadu.png"),
  parrot_eclectus: require("@/assets/images/birds/parrot_eclectus.png"),
  parrot_alexandrine: require("@/assets/images/birds/parrot_alexandrine.png"),
  parakeet_kakariki: require("@/assets/images/birds/parakeet_kakariki.png"),
  parrot_pyrrhura: require("@/assets/images/birds/parrot_pyrrhura.png"),
  canary: require("@/assets/images/birds/canary.png"),
  finch: require("@/assets/images/birds/finch.png"),
  pigeon: require("@/assets/images/birds/pigeon.png"),
  other: require("@/assets/images/birds/other.png"),
};

export const SIT_LOCATION_LABELS: Record<SitLocation, string> = {
  drop_off: "Отвезу к птичнику",
  at_my_home: "Только у меня дома",
  flexible: "Любой вариант",
};

export const SIT_LOCATION_ICONS: Record<SitLocation, string> = {
  drop_off: "truck",
  at_my_home: "home",
  flexible: "shuffle",
};

export const OTHER_PET_LABELS: Record<OtherPetType, string> = {
  dog: "Собака 🐕",
  cat: "Кошка 🐈",
  rodent: "Грызун 🐹",
  reptile: "Рептилия 🦎",
  fish: "Рыбки 🐟",
  other: "Другое",
};

export const HELP_STATUS_LABELS: Record<HelpStatus, string> = {
  ready: "Готов помогать",
  sometimes: "Иногда",
  not_now: "Пока нет",
};

export const HELP_STATUS_COLORS: Record<HelpStatus, string> = {
  ready: "#2d7d52",
  sometimes: "#f59e0b",
  not_now: "#9e9e9e",
};

export const REVIEW_TAGS = [
  "Вовремя кормил",
  "Отправлял фото",
  "Птица вернулась здоровой",
  "Соблюдал режим",
  "Знал особенности вида",
  "Был на связи",
  "Аккуратно обращался",
];

export const MOSCOW_DISTRICTS = [
  "Арбат",
  "Басманный",
  "Замоскворечье",
  "Красносельский",
  "Мещанский",
  "Пресненский",
  "Таганский",
  "Тверской",
  "Хамовники",
  "Якиманка",
  "Войковский",
  "Головинский",
  "Дмитровский",
  "Западное Дегунино",
  "Коптево",
  "Левобережный",
  "Молжаниновский",
  "Савёловский",
  "Тимирязевский",
  "Ховрино",
  "Алексеевский",
  "Алтуфьевский",
  "Бабушкинский",
  "Бутырский",
  "Лианозово",
  "Лосиноостровский",
  "Марьина роща",
  "Марьино",
  "Метрогородок",
  "Мещанский",
  "Останкинский",
  "Отрадное",
  "Ростокино",
  "Свиблово",
  "Северное Медведково",
  "Северный",
  "Южное Медведково",
  "Ярославский",
  "Бирюлёво Восточное",
  "Бирюлёво Западное",
  "Братеево",
  "Даниловский",
  "Донской",
  "Зябликово",
  "Москворечье-Сабурово",
  "Нагатинский затон",
  "Нагорный",
  "Орехово-Борисово Северное",
  "Орехово-Борисово Южное",
  "Печатники",
  "Царицыно",
  "Чертаново Северное",
  "Чертаново Центральное",
  "Чертаново Южное",
];
