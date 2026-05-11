import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "@/api/client";

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
  | "chicken"
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

export type SitType = "full" | "guest" | "medical_only";

export type SitterCapability =
  | "can_medicate"
  | "can_release"
  | "can_host"
  | "can_visit";

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
  sitTypes?: SitType[];
  capabilities?: SitterCapability[];
  createdAt: string;
}

export interface SitRequestBird {
  birdId: string;
  needsMedication: boolean;
}

export interface SitRequest {
  id: string;
  userId: string;
  birds: SitRequestBird[];
  sitType: SitType;
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
  openRequests: SitRequest[];
  reviews: Review[];
  neighbors: User[];
  isOnboarded: boolean;
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  addBird: (bird: Bird) => void;
  updateBird: (id: string, data: Partial<Bird>) => void;
  deleteBird: (id: string) => void;
  addSitRequest: (request: SitRequest) => void;
  updateSitRequest: (id: string, data: Partial<SitRequest>) => void;
  addReview: (review: Review) => void;
  completeOnboarding: () => void;
  updateHelpStatus: (status: HelpStatus) => void;
  updateOtherPets: (pets: OtherPet[]) => void;
  updateSitTypes: (types: SitType[]) => void;
  updateCapabilities: (caps: SitterCapability[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Достаёт «район» из адреса, который вернул Яндекс reverse-geocoder.
 * Сначала ищем сегмент со словами «район/округ/поселение», иначе берём
 * первый осмысленный сегмент (пропуская "Россия"). Используется чтобы
 * автоматически заполнять `User.district` по координатам пикера —
 * пользователь больше не выбирает район руками.
 */
export function extractDistrictFromAddress(address: string): string {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const districtPart = parts.find((p) => /район|округ|поселение/i.test(p));
  if (districtPart) return districtPart;
  return parts.find((p) => !/^Россия$/i.test(p)) || parts[0] || "";
}

const STORAGE_KEYS = {
  user: "@pernatye_user",
  userId: "@pernatye_user_id",
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

const MOCK_SIT_TYPES: Record<string, SitType[]> = {
  n1: ["full", "guest"],
  n2: ["full", "guest", "medical_only"],
  n3: ["guest"],
  n4: ["full", "guest"],
  n5: ["full", "guest", "medical_only"],
  n6: ["guest"],
  n7: ["full", "guest"],
  n8: ["full", "medical_only"],
  n9: ["guest"],
  n10: ["full", "guest"],
  n11: ["full", "guest", "medical_only"],
  n12: ["full", "guest", "medical_only"],
  n13: ["guest"],
  n14: ["full", "guest", "medical_only"],
  n15: ["full", "guest"],
  n16: ["guest"],
  n17: ["full", "guest", "medical_only"],
  n18: ["guest"],
  n19: ["full", "guest"],
  n20: ["guest"],
};

const ALL_CAPS: SitterCapability[] = ["can_medicate", "can_release", "can_host", "can_visit"];

const MOCK_CAPABILITIES: Record<string, SitterCapability[]> = {
  n1: ALL_CAPS,
  n2: ALL_CAPS,
  n3: ["can_host", "can_medicate"],
  n4: ["can_visit", "can_release"],
  n5: ALL_CAPS,
  n6: ["can_host"],
  n7: ALL_CAPS,
  n8: ["can_host", "can_medicate"],
  n9: ["can_visit", "can_release"],
  n10: ["can_host"],
  n11: ["can_visit", "can_release"],
  n12: ALL_CAPS,
  n13: [],
  n14: ["can_host", "can_medicate"],
  n15: ["can_host"],
  n16: ["can_host"],
  n17: ALL_CAPS,
  n18: [],
  n19: ["can_visit", "can_release"],
  n20: [],
};

const NEIGHBORS_WITH_SIT_TYPES: User[] = MOCK_NEIGHBORS.map((n) => ({
  ...n,
  sitTypes: MOCK_SIT_TYPES[n.id] ?? ["full", "guest"],
  capabilities: MOCK_CAPABILITIES[n.id] ?? [],
}));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [sitRequests, setSitRequests] = useState<SitRequest[]>([]);
  const [openRequests, setOpenRequests] = useState<SitRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [neighbors, setNeighbors] = useState<User[]>(NEIGHBORS_WITH_SIT_TYPES);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadNeighbors = async () => {
      try {
        const data = await apiRequest<User[]>("/api/users?city=Москва");
        if (Array.isArray(data) && data.length >= 2) {
          setNeighbors(data);
        } else if (Array.isArray(data)) {
          setNeighbors([...data, ...NEIGHBORS_WITH_SIT_TYPES].slice(0, 20));
        }
      } catch {
        // API недоступен — используем мок-данные
      }
    };
    loadNeighbors();
  }, []);

  useEffect(() => {
    const loadOpenRequests = async () => {
      try {
        const data = await apiRequest<SitRequest[]>(
          "/api/sit-requests?status=open"
        );
        if (Array.isArray(data)) setOpenRequests(data);
      } catch {
        // API недоступен — слой передержек просто будет пустой
      }
    };
    loadOpenRequests();
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
      if (requestsStr) {
        const parsed = JSON.parse(requestsStr) as Array<
          SitRequest | (Omit<SitRequest, "birds"> & { bird_ids?: string[] })
        >;
        const migrated: SitRequest[] = parsed.map((r) => {
          if ("birds" in r && Array.isArray(r.birds)) return r as SitRequest;
          const legacyIds = (r as { bird_ids?: string[] }).bird_ids ?? [];
          const { bird_ids: _omit, ...rest } = r as Omit<SitRequest, "birds"> & {
            bird_ids?: string[];
          };
          return {
            ...(rest as Omit<SitRequest, "birds">),
            birds: legacyIds.map((birdId) => ({ birdId, needsMedication: false })),
          };
        });
        setSitRequests(migrated);
      }
      if (reviewsStr) setReviews(JSON.parse(reviewsStr));
      if (onboardedStr) setIsOnboarded(JSON.parse(onboardedStr));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const setCurrentUser = useCallback(async (user: User) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.userId, user.id);
    if (!isValidUUID(user.id)) {
      // локальный (не-UUID) id — данные сохранены только локально
      return;
    }
    try {
      await apiRequest(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: user.name,
            district: user.district,
            lat: user.lat,
            lng: user.lng,
            helpStatus: user.helpStatus,
            experienceYears: user.experienceYears,
            sitTypes: user.sitTypes,
            capabilities: user.capabilities,
            otherPets: user.otherPets,
          }),
        },
        user.id
      );
    } catch {
      // API недоступен — данные сохранены локально
    }
  }, []);

  const addBird = useCallback(
    async (bird: Bird) => {
      setBirds((prev) => {
        const next = [...prev, bird];
        AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id && isValidUUID(currentUser.id)) {
        try {
          await apiRequest(
            "/api/birds",
            {
              method: "POST",
              body: JSON.stringify(bird),
            },
            currentUser.id
          );
        } catch {
          // API недоступен — данные только локально
        }
      }
    },
    [currentUser?.id]
  );

  const updateBird = useCallback(
    async (id: string, data: Partial<Bird>) => {
      setBirds((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...data } : b));
        AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id && isValidUUID(currentUser.id) && isValidUUID(id)) {
        try {
          await apiRequest(
            `/api/birds/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(data),
            },
            currentUser.id
          );
        } catch {
          // API недоступен — данные только локально
        }
      }
    },
    [currentUser?.id]
  );

  const deleteBird = useCallback(
    async (id: string) => {
      setBirds((prev) => {
        const next = prev.filter((b) => b.id !== id);
        AsyncStorage.setItem(STORAGE_KEYS.birds, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id && isValidUUID(currentUser.id) && isValidUUID(id)) {
        try {
          await apiRequest(
            `/api/birds/${id}`,
            { method: "DELETE" },
            currentUser.id
          );
        } catch {
          // API недоступен — данные только локально
        }
      }
    },
    [currentUser?.id]
  );

  const addSitRequest = useCallback(
    async (request: SitRequest) => {
      setSitRequests((prev) => {
        const next = [...prev, request];
        AsyncStorage.setItem(STORAGE_KEYS.sitRequests, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id && isValidUUID(currentUser.id)) {
        try {
          await apiRequest(
            "/api/sit-requests",
            {
              method: "POST",
              body: JSON.stringify(request),
            },
            currentUser.id
          );
        } catch {
          // API недоступен — данные только локально
        }
      }
    },
    [currentUser?.id]
  );

  const updateSitRequest = useCallback(
    async (id: string, data: Partial<SitRequest>) => {
      setSitRequests((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, ...data, id: r.id } : r));
        AsyncStorage.setItem(STORAGE_KEYS.sitRequests, JSON.stringify(next));
        return next;
      });
      // Если сменился статус — синхронно убираем/добавляем запрос в слой
      // открытых передержек, чтобы маркер на карте пропал сразу.
      if (data.status !== undefined) {
        if (data.status === "open") {
          // Запрос вернулся в open (например, после reopen) — добавляем
          // или обновляем его в слое открытых передержек.
          setSitRequests((current) => {
            const source = current.find((r) => r.id === id);
            if (source) {
              setOpenRequests((prev) =>
                prev.some((r) => r.id === id)
                  ? prev.map((r) => (r.id === id ? source : r))
                  : [source, ...prev]
              );
            }
            return current;
          });
        } else {
          setOpenRequests((prev) => prev.filter((r) => r.id !== id));
        }
      } else {
        setOpenRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data, id: r.id } : r))
        );
      }
      // Серверная синхронизация. Для статуса используем выделенный
      // эндпоинт — он один умеет менять status под requireAuth.
      if (!isValidUUID(id) || !currentUser?.id || !isValidUUID(currentUser.id)) {
        return;
      }
      try {
        if (data.status !== undefined) {
          await apiRequest(
            `/api/sit-requests/${id}/status`,
            {
              method: "PUT",
              body: JSON.stringify({ status: data.status }),
            },
            currentUser.id
          );
        }
        const { status: _status, ...rest } = data;
        if (Object.keys(rest).length > 0) {
          await apiRequest(
            `/api/sit-requests/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(rest),
            },
            currentUser.id
          );
        }
      } catch {
        // API недоступен — данные сохранены локально, маркер всё равно
        // обновится после следующей перезагрузки openRequests с сервера.
      }
    },
    [currentUser?.id]
  );

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

  const updateSitTypes = useCallback(
    async (types: SitType[]) => {
      if (!currentUser) return;
      const updated = { ...currentUser, sitTypes: types };
      setCurrentUser(updated);
    },
    [currentUser, setCurrentUser]
  );

  const updateCapabilities = useCallback(
    async (caps: SitterCapability[]) => {
      if (!currentUser) return;
      const updated = { ...currentUser, capabilities: caps };
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
        openRequests,
        reviews,
        neighbors,
        isOnboarded,
        isLoading,
        setCurrentUser,
        addBird,
        updateBird,
        deleteBird,
        addSitRequest,
        updateSitRequest,
        addReview,
        completeOnboarding,
        updateHelpStatus,
        updateOtherPets,
        updateSitTypes,
        updateCapabilities,
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
  chicken: "Курица 🐓",
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
  chicken: "🐓",
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
  chicken: require("@/assets/images/birds/other.png"),
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

export const SIT_TYPE_LABELS: Record<SitType, string> = {
  full: "🏠 К ситтеру — птица живёт у помощника",
  guest: "🏡 К себе — ситтер приходит домой к хозяину",
  medical_only: "💊 Помощь с лечением — хозяин дома, нужна помощь с процедурами",
};

export const SITTER_CAPABILITY_LABELS: Record<SitterCapability, string> = {
  can_medicate: "💊 Готов давать лекарства",
  can_release: "🕊️ Готов выпускать и ловить",
  can_host: "🏠 Готов принять птицу у себя",
  can_visit: "🏡 Готов приходить к хозяину",
};

export const SIT_TYPE_SHORT: Record<SitType, string> = {
  full: "🏠 Полная",
  guest: "🏡 Гостевой",
  medical_only: "💊 Лечение",
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
