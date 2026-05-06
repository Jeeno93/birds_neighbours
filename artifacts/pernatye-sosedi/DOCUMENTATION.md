# Документация — Пернатые соседи

## Содержание

1. [О продукте](#о-продукте)
2. [Стек технологий](#стек-технологий)
3. [Структура проекта](#структура-проекта)
4. [Запуск и разработка](#запуск-и-разработка)
5. [Архитектура состояния](#архитектура-состояния)
6. [Типы данных](#типы-данных)
7. [Константы и справочники](#константы-и-справочники)
8. [Экраны и пользовательские сценарии](#экраны-и-пользовательские-сценарии)
9. [Компоненты](#компоненты)
10. [Дизайн-система и темы](#дизайн-система-и-темы)
11. [Мок-данные](#мок-данные)
12. [Известные ограничения и Roadmap](#известные-ограничения-и-roadmap)

---

## О продукте

**Пернатые соседи** — мобильное приложение-сообщество для владельцев птиц в Москве. Помогает найти надёжного соседа-птичника, который присмотрит за питомцем на время поездки.

### Целевая аудитория

Владельцы домашних птиц (попугаи, канарейки, голуби и др.) в Москве, которым нужен проверенный человек для временного присмотра за питомцем.

### Ключевая ценность

- Находить птичников по районам Москвы на карте
- Хранить подробную карточку ухода за птицей (корм, режим, болезни, ветеринар, вложения)
- Связываться напрямую через Telegram
- Читать полезные гайды по уходу за птицами

---

## Стек технологий

| Слой | Технология | Версия |
|------|-----------|--------|
| Фреймворк | Expo + React Native | 54.x / 0.81.5 |
| Маршрутизация | expo-router | 6.x |
| Шрифты | @expo-google-fonts/inter | 0.4.x |
| Хранилище | AsyncStorage | 2.2.0 |
| Карты | временно заглушка без нативных зависимостей (см. ниже) | — |
| Иконки | @expo/vector-icons (Feather) + expo-symbols | — |
| Жесты | react-native-gesture-handler | 2.28.x |
| Тактильная обратная связь | expo-haptics | 15.x |
| Вложения | expo-document-picker | ~14.0.8 |
| Фото птиц | expo-image-picker | ~17.0.8 |
| Клавиатура | react-native-keyboard-controller | 1.18.5 |
| Безопасные зоны | react-native-safe-area-context | 5.6.x |
| Типизация | TypeScript | 5.9 |
| Менеджер пакетов | pnpm (workspaces) | — |

> **Примечание про карту:** карта реализована через `react-native-webview` + Яндекс Maps JS API 2.1. После того как `react-native-maps` крашил на реальных Android-устройствах, а `react-native-yamap` оказался несовместим с Expo SDK 54, выбран принципиально другой подход — Yandex JS API внутри WebView без нативной компиляции. Маркеры передаются из RN в HTML через сериализованный JSON и обратно через `window.ReactNativeWebView.postMessage`. API-ключ берётся из переменной окружения `EXPO_PUBLIC_YANDEX_MAPS_API_KEY` (на expo.dev она уже задана).

---

## Структура проекта

```
artifacts/pernatye-sosedi/
├── app/                          # Экраны (file-based routing)
│   ├── _layout.tsx               # Корневой layout: ThemeProvider, AppProvider, шрифты, splash
│   ├── index.tsx                 # Точка входа (редирект на онбординг или табы)
│   ├── +not-found.tsx            # Экран 404
│   ├── (tabs)/                   # Основная навигация (4 вкладки)
│   │   ├── _layout.tsx           # Конфигурация таб-бара
│   │   ├── map.tsx               # Карта птичников
│   │   ├── birds.tsx             # Мои птицы
│   │   ├── feed.tsx              # Гайды и статьи
│   │   └── profile.tsx           # Мой профиль
│   ├── onboarding/
│   │   └── index.tsx             # Онбординг (6 шагов)
│   ├── neighbor/
│   │   └── [id].tsx              # Профиль соседа-птичника
│   ├── bird/
│   │   └── [id].tsx              # Детальная карточка птицы
│   ├── edit-bird/
│   │   └── [id].tsx              # Редактирование существующей птицы
│   ├── edit-request/
│   │   └── [id].tsx              # Редактирование существующего запроса на присмотр
│   ├── article/
│   │   └── [id].tsx              # Полный текст статьи
│   ├── add-bird.tsx              # Добавление новой птицы
│   ├── new-request.tsx           # Создание запроса на присмотр
│   ├── neighbors.tsx             # Список птичников с поиском
│   ├── sit-requests.tsx          # Мои запросы на присмотр
│   ├── settings.tsx              # Настройки: тема, профиль, данные
│   └── edit-profile.tsx          # Редактирование своего профиля
├── components/                   # Переиспользуемые компоненты
│   ├── Avatar.tsx                # Аватар пользователя
│   ├── BirdCard.tsx              # Карточка птицы (обычная и compact)
│   ├── BirdSpeciesIcon.tsx       # Фото-иконка вида птицы
│   ├── NeighborCard.tsx          # Карточка соседа-птичника
│   ├── RatingStars.tsx           # Звёздный рейтинг
│   ├── HelpStatusBadge.tsx       # Бейдж статуса готовности
│   ├── NativeMap.tsx             # Карта на WebView + Яндекс Maps JS API 2.1 (маркеры через postMessage)
│   ├── ErrorBoundary.tsx         # Граница ошибок
│   ├── ErrorFallback.tsx         # UI при ошибке
│   └── KeyboardAwareScrollViewCompat.tsx
├── context/
│   ├── AppContext.tsx            # Глобальное состояние + мок-данные + константы
│   └── ThemeContext.tsx          # Управление темой (light / dark / system)
├── constants/
│   └── colors.ts                 # Дизайн-токены (light + dark + radius)
├── hooks/
│   └── useColors.ts              # Хук: возвращает токены цветов текущей темы
├── types/
│   └── map.ts                    # Тип Region (зарезервирован для возврата интерактивной карты)
├── assets/
│   ├── images/
│   │   ├── birds/                # 16 фотографий видов птиц (PNG, 1:1)
│   │   │   ├── parrot_budgie.png
│   │   │   ├── parrot_corella.png
│   │   │   ├── parrot_lovebird.png
│   │   │   ├── parrot_rosella.png
│   │   │   ├── parrot_amazon.png
│   │   │   ├── parrot_jaco.png
│   │   │   ├── parrot_ara.png
│   │   │   ├── parrot_kakadu.png
│   │   │   ├── parrot_eclectus.png
│   │   │   ├── parrot_alexandrine.png
│   │   │   ├── parakeet_kakariki.png
│   │   │   ├── parrot_pyrrhura.png
│   │   │   ├── canary.png
│   │   │   ├── finch.png
│   │   │   ├── pigeon.png
│   │   │   └── other.png
│   │   ├── onboarding-welcome.png  # Иллюстрация на первом экране онбординга
│   │   └── icon.png
│   └── fonts/
├── package.json
├── tsconfig.json
├── app.json
├── DOCUMENTATION.md              # Этот документ
└── QA_REPORT.md                  # Последний QA-аудит приложения
```

---

## Запуск и разработка

### Требования

- Node.js 20+
- pnpm 9+
- Expo Go на смартфоне (iOS / Android)

### Команды

```bash
# Запустить приложение (dev-режим)
pnpm --filter @workspace/pernatye-sosedi run dev

# Или из корня монорепозитория:
pnpm run dev   # запустит все воркфлоу

# Проверка типов
pnpm --filter @workspace/pernatye-sosedi run typecheck
```

### Тестирование на устройстве

1. Откройте Expo Go на смартфоне
2. Запустите команду выше — в консоли появится QR-код
3. Отсканируйте QR-код в приложении Expo Go

### Веб-версия

Приложение поддерживает веб-среду (`Platform.OS === 'web'`). Карта (`components/NativeMap.tsx`) использует `react-native-webview`, который на вебе рендерится в `<iframe>` — поэтому отдельная веб-версия не нужна и Яндекс-карта одинаково работает на iOS, Android и в браузере.

### Переменные окружения

| Переменная | Назначение |
|-----------|-----------|
| `REPLIT_EXPO_DEV_DOMAIN` | Домен для Expo packager proxy |
| `REPLIT_DEV_DOMAIN` | Публичный домен Replit |
| `REPL_ID` | ID Replit Repl |
| `PORT` | Порт Metro Bundler |

---

## Архитектура состояния

Всё состояние хранится локально в `AsyncStorage` через два React-провайдера.

### Порядок вложенности в `app/_layout.tsx`

```tsx
<ThemeProvider>       // context/ThemeContext.tsx
  <AppProvider>       // context/AppContext.tsx
    {children}
  </AppProvider>
</ThemeProvider>
```

### Ключи AsyncStorage

| Ключ | Содержимое |
|------|-----------|
| `@pernatye_user` | Профиль текущего пользователя (`User`) |
| `@pernatye_birds` | Массив птиц пользователя (`Bird[]`) |
| `@pernatye_sit_requests` | Запросы на присмотр (`SitRequest[]`) |
| `@pernatye_reviews` | Написанные отзывы (`Review[]`) |
| `@pernatye_onboarded` | Флаг завершения онбординга (`boolean`) |
| `@pernatye_theme_mode` | Выбранная тема (`"light"` / `"dark"` / `"system"`) |

### Хук useApp()

```tsx
import { useApp } from '@/context/AppContext';

function MyScreen() {
  const {
    currentUser,        // User | null
    birds,              // Bird[]
    sitRequests,        // SitRequest[]
    reviews,            // Review[]
    neighbors,          // User[] (20 мок-соседей)
    isOnboarded,        // boolean
    isLoading,          // boolean — true пока идёт первичная загрузка из AsyncStorage

    setCurrentUser,     // (user: User) => void
    addBird,            // (bird: Bird) => void
    updateBird,         // (id: string, data: Partial<Bird>) => void
    deleteBird,         // (id: string) => void
    addSitRequest,      // (request: SitRequest) => void
    updateSitRequest,   // (id: string, data: Partial<SitRequest>) => void
    addReview,          // (review: Review) => void
    completeOnboarding, // () => void
    updateHelpStatus,   // (status: HelpStatus) => void
    updateOtherPets,    // (pets: OtherPet[]) => void
  } = useApp();
}
```

### Хук useThemeMode()

```tsx
import { useThemeMode } from '@/context/ThemeContext';

function MyScreen() {
  const { mode, setMode } = useThemeMode();
  // mode: "light" | "dark" | "system"
  // setMode: (m: ThemeMode) => void — сохраняет в AsyncStorage
}
```

---

## Типы данных

### User

Профиль птичника (как текущего пользователя, так и соседей).

```ts
interface User {
  id: string;
  telegramId: string;       // Telegram username или ID
  name: string;
  photoUrl?: string;        // URL фото (опционально)
  district: string;         // Район Москвы
  lat?: number;             // Широта (для карты)
  lng?: number;             // Долгота (для карты)
  experienceYears: number;  // Лет опыта с птицами
  helpStatus: HelpStatus;   // Статус готовности помогать
  rating: number;           // Средняя оценка (0–5)
  createdAt: string;        // ISO дата регистрации
}
```

### Bird

Птица, принадлежащая пользователю. Содержит расширенную карточку ухода.

```ts
interface Bird {
  id: string;
  userId: string;
  species: BirdSpecies;     // Вид птицы (15 вариантов)
  name: string;             // Кличка
  photoUrl?: string;        // Фото птицы (загружается через expo-image-picker на экранах bird/[id] и edit-bird/[id])
  ageMonths?: number;       // Возраст в месяцах
  food: string;             // Чем кормить и как часто
  schedule: string;         // Режим дня
  diseases: string[];       // Список болезней
  medications: string;      // Медикаменты и дозировки
  catchNotes: string;       // Особенности ловли
  vetNotes: string;         // Ветеринарные нюансы
  sitLocation?: SitLocation; // Где удобно оставить птицу
  vetName?: string;         // Имя ветеринара
  vetContact?: string;      // Телефон или Telegram ветеринара
  attachments?: BirdAttachment[]; // Файлы (выписки, рецепты)
  createdAt: string;        // ISO дата добавления
}
```

### SitLocation

Место передачи птицы для присмотра:

```ts
type SitLocation = "drop_off" | "at_my_home" | "flexible";
// "drop_off"   → "Отвезу к птичнику"
// "at_my_home" → "Только у меня дома"
// "flexible"   → "Любой вариант"
```

### BirdAttachment

Файловое вложение к карточке птицы:

```ts
interface BirdAttachment {
  id: string;        // Уникальный идентификатор
  name: string;      // Имя файла
  uri: string;       // Локальный URI (expo-document-picker)
  mimeType?: string; // MIME-тип (например, application/pdf)
  size?: number;     // Размер в байтах
}
```

> На экране карточки птицы (`app/bird/[id].tsx`) рядом со списком вложений показывается предупреждение, что файлы хранятся локально на устройстве и пропадут при переустановке приложения.

### SitRequest

Запрос на поиск временного присмотра за птицей.

```ts
interface SitRequestBird {
  birdId: string;
  needsMedication: boolean; // Нужно ли давать лекарства этой конкретной птице
}

interface SitRequest {
  id: string;
  userId: string;
  birds: SitRequestBird[];  // Один или несколько объектов SitRequestBird
  sitType: SitType;         // Тип передержки (full / guest / medical_only)
  dateFrom: string;         // ISO дата начала
  dateTo: string;           // ISO дата окончания
  district: string;         // Желаемый район
  comment: string;          // Дополнительные пожелания
  status: "open" | "matched" | "closed";
  createdAt: string;
}
```

### SitType

Тип присмотра, который запрашивается / предлагается:

```ts
type SitType = "full" | "guest" | "medical_only";
// "full"         → "🏠 К ситтеру — птица живёт у помощника"
// "guest"        → "🏡 К себе — ситтер приходит домой к хозяину"
// "medical_only" → "💊 Помощь с лечением — хозяин дома, нужна помощь с процедурами"
```

Используются константы `SIT_TYPE_LABELS` (полные подписи) и `SIT_TYPE_SHORT` (короткие бейджи) из `context/AppContext`.

В `User` появилось необязательное поле `sitTypes?: SitType[]` — какие виды присмотра пользователь готов оказывать. Редактируется в `app/(tabs)/profile.tsx` (блок «Что я готов делать», multiselect) через `updateSitTypes(types)` из `useApp()`. На карточке соседа (`app/neighbor/[id].tsx`) и в фильтре `app/neighbors.tsx` доступные типы отображаются короткими бейджами.

### SitterCapability

Конкретные навыки ситтера. Хранится в `User.capabilities?: SitterCapability[]`.

```ts
type SitterCapability = "can_medicate" | "can_release" | "can_host" | "can_visit";
// can_medicate → "💊 Готов давать лекарства"
// can_release  → "🕊️ Готов выпускать и ловить"
// can_host     → "🏠 Готов принять птицу у себя"
// can_visit    → "🏡 Готов приходить к хозяину"
```

Подписи — в `SITTER_CAPABILITY_LABELS`. Редактируется в `app/(tabs)/profile.tsx` (блок «Что я умею как ситтер», multiselect) через `updateCapabilities(caps)` из `useApp()`. На профиле соседа (`app/neighbor/[id].tsx`) показывается отдельным разделом «Умеет» — чипы с навыками; если список пуст, выводится подсказка «Уточните при общении».

### Логика подбора (smart matching)

В `app/neighbors.tsx` и `app/(tabs)/map.tsx` берётся последний открытый `SitRequest` пользователя как контекст подбора:
- если `sitType === "full"` → требуется `can_host`;
- если `sitType === "guest"` → требуется `can_visit`;
- если у любой птицы запроса `needsMedication === true` → требуется `can_medicate`.

Несовместимые соседи **не скрываются**: в списке они помечаются серой плашкой «Может не подойти» (через проп `mayNotMatch` в `NeighborCard`) и опускаются в конец сортировки; на карте их маркеры окрашиваются в серый (`#9ca3af`) через `markerColor` в `MarkerData`.

### Review

Отзыв об опыте присмотра.

```ts
interface Review {
  id: string;
  fromUserId: string;       // Кто оставил
  toUserId: string;         // Кому оставили
  tags: string[];           // Теги из REVIEW_TAGS
  comment: string;          // Текстовый комментарий
  createdAt: string;
}
```

### HelpStatus

```ts
type HelpStatus = "ready" | "sometimes" | "not_now";
// "ready"     → "Готов помогать"
// "sometimes" → "Иногда"
// "not_now"   → "Пока нет"
```

### BirdSpecies

17 видов птиц:

```ts
type BirdSpecies =
  | "parrot_budgie"      // Волнистый попугай
  | "parrot_corella"     // Попугай Корелла
  | "parrot_lovebird"    // Неразлучник
  | "parrot_rosella"     // Розелла
  | "parrot_amazon"      // Амазон
  | "parrot_jaco"        // Жако
  | "parrot_ara"         // Ара
  | "parrot_kakadu"      // Какаду
  | "parrot_eclectus"    // Эклектус
  | "parrot_alexandrine" // Александрийский попугай
  | "parakeet_kakariki"  // Какарики
  | "parrot_pyrrhura"    // Пиррура
  | "canary"             // Канарейка
  | "finch"              // Амадин
  | "pigeon"             // Голубь
  | "chicken"            // Курица 🐓 (использует other.png как изображение)
  | "other";             // Другой вид
```

### OtherPet / OtherPetType

Питомцы (не птицы), живущие у пользователя. Помогают соседям-птичникам понять совместимость.

```ts
type OtherPetType = "dog" | "cat" | "rodent" | "reptile" | "fish" | "other";

interface OtherPet {
  type: OtherPetType;
  name?: string; // необязательное имя питомца
}
```

В `User` появилось поле `otherPets?: OtherPet[]`. Пользователь редактирует список через множественный выбор в `app/(tabs)/profile.tsx` → секция «Другие питомцы дома» (внутри карточки профиля, прямо под блоком готовности помогать). Обновление выполняется методом `updateOtherPets(pets)` из `useApp()`.

### Bird (расширение полей ветеринарии)

Дополнительные поля для секции «Ветеринария» в карточке птицы:

```ts
interface Bird {
  // ... существующие поля
  wasExamined?: boolean;        // Проходила ли птица ветобследование
  vetName?: string;             // Имя врача / клиника (показывается, если wasExamined)
  vetContact?: string;          // Телефон или Telegram ветеринара (кликабельно)
  lastCheckupDate?: string;     // Дата последнего осмотра (свободный текст)
  medicationExperience?: string;// Опыт дачи препаратов (как и какие давали)
}
```

В `app/add-bird.tsx` и `app/edit-bird/[id].tsx` секция «Ветеринария» содержит `Switch wasExamined` (показ поля «Врач / клиника» только при значении true), поля даты осмотра, контакта ветеринара и описания опыта дачи препаратов. В `app/bird/[id].tsx` все эти поля выводятся отдельным блоком инфо-карточек.

### ThemeMode

```ts
type ThemeMode = "light" | "dark" | "system";
// По умолчанию: "light"
// Сохраняется в AsyncStorage под ключом @pernatye_theme_mode
```

---

## Константы и справочники

Все константы (кроме темы) экспортируются из `context/AppContext.tsx`.

### SPECIES_LABELS
Русские названия видов птиц: `Record<BirdSpecies, string>`.

### SPECIES_IMAGES
Статические ссылки на фотографии птиц для каждого вида: `Record<BirdSpecies, number>`.
Содержит `require()`-ссылки на PNG-файлы из `assets/images/birds/`.
Используется компонентом `BirdSpeciesIcon`.

```ts
import { SPECIES_IMAGES } from '@/context/AppContext';
// SPECIES_IMAGES["parrot_budgie"] → require("@/assets/images/birds/parrot_budgie.png")
```

### OTHER_PET_LABELS
Русские названия типов других питомцев с эмодзи: `Record<OtherPetType, string>`.
Например: `dog → "Собака 🐕"`, `cat → "Кошка 🐈"`, `rodent → "Грызун 🐹"`, `reptile → "Рептилия 🦎"`, `fish → "Рыбки 🐟"`, `other → "Другое"`.

Используется в `app/(tabs)/profile.tsx` (мультивыбор внутри карточки профиля), `components/NeighborCard.tsx` (бейджи в списке) и `app/neighbor/[id].tsx` (бейджи в профиле соседа).

### SIT_LOCATION_LABELS
Русские названия типов передачи птицы: `Record<SitLocation, string>`.

### SIT_LOCATION_ICONS
Иконки Feather для каждого типа передачи: `Record<SitLocation, string>`.

### HELP_STATUS_LABELS
Русские названия статусов готовности: `Record<HelpStatus, string>`.

### HELP_STATUS_COLORS
HEX-цвета для каждого статуса:
- `ready` → `#2d7d52` (зелёный)
- `sometimes` → `#f59e0b` (янтарный)
- `not_now` → `#9e9e9e` (серый)

### REVIEW_TAGS
Предустановленные теги для отзывов:
- «Вовремя кормил»
- «Отправлял фото»
- «Птица вернулась здоровой»
- «Соблюдал режим»
- «Знал особенности вида»
- «Был на связи»
- «Аккуратно обращался»

### MOSCOW_DISTRICTS
Массив из 54 районов Москвы для выбора локации пользователя (центр, север, северо-восток, юг).

---

## Экраны и пользовательские сценарии

### Онбординг (`/onboarding`)

Горизонтальный FlatList с 6 экранами. Прогресс-бар в шапке. Кнопки «Пропустить» (шаги 3–4) и «Далее» / «Открыть карту».

| Шаг | Экран | Что происходит |
|-----|-------|---------------|
| 0 | Приветствие | Иллюстрация + слоган |
| 1 | Вход | Ввод имени (имитация Telegram Auth) |
| 2 | Птица | Выбор вида (сетка 3×5 с фото) + кличка |
| 3 | Карточка ухода | Корм, режим, болезни, особенности ловли |
| 4 | Профиль птичника | Район, лет опыта, статус готовности |
| 5 | Карта | Интерактивная карта Москвы (`NativeMap` — WebView + Yandex Maps) с маркерами 20 птичников |

Кнопка «Пропустить» доступна только на шагах 3 и 4 (`canSkip = step >= 3 && step < totalSteps - 1`).

По завершению создаётся `User` и первая `Bird`, вызывается `completeOnboarding()`, происходит редирект на `/(tabs)/map`.

---

### Карта (`/(tabs)/map`)

- Карта рендерится компонентом `components/NativeMap.tsx` через `react-native-webview` + Яндекс Maps JS API 2.1.
- В `MapScreen` строится массив `mapMarkers: MarkerData[]` из соседей с заполненными `lat`/`lng` (отфильтрованных по выбранному виду птицы) и передаётся в `<NativeMap region markers onMarkerPress />`.
- При тапе на маркер срабатывает `handleMarkerPress(id)` — лёгкая haptic + переход на `/neighbor/[id]`.
- Фильтр по виду птицы (горизонтальный `ScrollView` с чипами) фильтрует маркеры на лету; кнопка «Список» (`/neighbors`) ведёт в полный список.
- Если у пользователя ещё нет ни одного запроса (`sitRequests.length === 0`), поверх карты выводится подсказка-карточка «Создай первый запрос» с кнопкой `→ /new-request`.

---

### Список птичников (`/neighbors`)

- Полный список с аватарами, районом, опытом, статусом, рейтингом
- Строка поиска по имени и району
- Сортировка: по рейтингу (`rating`) или по опыту (`experience`)
- Тап на карточку → профиль птичника

---

### Профиль птичника (`/neighbor/[id]`)

- Полная карточка: фото, имя, район, опыт, рейтинг, статус
- Список его птиц с фото-иконками видов
- Отзывы с тегами и комментариями
- Кнопка «Написать в Telegram» (открывает `https://t.me/{telegramId}`)

---

### Мои птицы (`/(tabs)/birds`)

- Список птиц текущего пользователя
- Пустое состояние с призывом добавить птицу
- Кнопка + открывает форму добавления

---

### Карточка птицы (`/bird/[id]`)

- Фото птицы или фото-заглушка вида (через `BirdSpeciesIcon`). Тап по фото открывает `expo-image-picker` (`launchImageLibraryAsync` с обрезкой 1:1, quality 0.8) и сразу сохраняет URI через `updateBird(id, { photoUrl })`. Если фото ещё нет, под плейсхолдером показывается подсказка «Нажми чтобы добавить фото».
- Название, вид, возраст
- Карточка ухода: кормление, режим, болезни, медикаменты, особенности ловли, ветеринарные нюансы
- Место передачи: «Отвезу к птичнику» / «Только у меня дома» / «Как договоримся»
- Контакт ветеринара (тап → звонок или Telegram)
- Раздел «Файлы» — всегда доступен: показывает уже прикреплённые вложения (с тап-открытием и кнопкой ✕ для удаления) и кнопку «Прикрепить справку или фото» (`expo-document-picker` → `updateBird(id, { attachments })`). Все изменения сохраняются сразу.
- Кнопки редактирования (→ `/edit-bird/[id]`) и удаления (с подтверждением) в шапке.

---

### Добавление птицы (`/add-bird`)

Форма: выбор вида (сетка 3×5 с реальными фото птиц), кличка, возраст, все поля карточки ухода, выбор места передачи, контакт ветеринара, прикрепление файлов. Данные сохраняются через `addBird()`.

---

### Редактирование птицы (`/edit-bird/[id]`)

Полная копия формы `/add-bird` с предзаполненными данными существующей птицы. Получает `id` через `useLocalSearchParams`, ищет `bird` в `birds` из `useApp()` и инициализирует все `useState` его значениями. Дополнительно сверху формы — большой превью-блок фото (тап → `expo-image-picker`), при отсутствии фото показывается `BirdSpeciesIcon` с подсказкой «Нажми чтобы добавить фото». Сохранение собирает `Partial<Bird>` и вызывает `updateBird(id, data)`. Открывается тапом по иконке ✏️ в шапке `/bird/[id]`.

---

### Гайды (`/(tabs)/feed`)

- Выделенная карточка «Популярное» (зелёный баннер)
- Список статей с фото-тегами видов, временем чтения, датой
- Тап → полный текст статьи

Встроенные статьи (5 штук):
1. Как правильно кормить волнистого попугая
2. 10 признаков, что ваша птица заболела
3. Как подготовить птицу к временной передаче
4. Корелла: характер и особенности содержания
5. Как найти хорошего птичника для вашей канарейки

---

### Профиль (`/(tabs)/profile`)

- Карточка пользователя: аватар, имя, район, опыт, рейтинг
- Редактирование статуса готовности (инлайн-пикер)
- Раздел «Другие питомцы дома» (внутри карточки профиля, сразу под блоком статуса) — мультивыбор чипов (`dog/cat/rodent/reptile/fish/other`), сохраняется через `updateOtherPets()`
- Статистика: количество птиц («Птиц: N»), запросов, отзывов. Полный список птиц — только во вкладке «Птицы», на профиле его больше нет.
- Раздел «Запросы» (кнопки «Мои запросы» и «Создать новый»)
- Кнопка настроек → `/settings`

---

### Запросы на присмотр (`/sit-requests`)

Список всех запросов пользователя с фото-иконкой вида птицы, датами, районом, статусом (`open` / `matched` / `closed`). Для запросов в статусе `open` рядом со статус-бейджем выводится кнопка ✏️ (`Feather edit-2`), которая ведёт на `/edit-request/${id}`.

---

### Редактирование запроса (`/edit-request/[id]`)

Полная копия формы `/new-request` с предзаполненными данными существующего запроса. Получает `id` через `useLocalSearchParams`, ищет запрос в `sitRequests` из `useApp()` и инициализирует все `useState` его значениями (`sitType`, `birds`, `dateFrom`, `dateTo`, `district`, `comment`). Сохранение собирает `Partial<SitRequest>` и вызывает `updateSitRequest(id, data)` из `useApp()`, после чего возвращает на предыдущий экран. Если запрос с переданным `id` не найден, экран показывает заглушку «Запрос не найден». Открывается тапом по иконке ✏️ на карточке запроса в `/sit-requests` (только для `status === "open"`).

---

### Создание запроса (`/new-request`)

Форма: первым шагом — обязательный radio-выбор `SitType` (к ситтеру / к себе / помощь с лечением); затем мультивыбор одной или нескольких птиц (чекбоксы). Под каждой выбранной птицей появляется переключатель «Нужно лечение» (`Switch`), что сохраняется в `SitRequestBird.needsMedication`. Далее — даты начала/конца, желаемый район, комментарий. Сохраняется через `addSitRequest()` в виде `birds: SitRequestBird[]` + `sitType: SitType`. После создания подсчитываются подходящие птичники с учётом `sitTypes` и `capabilities` соседа: если у любой птицы стоит `needsMedication`, требуется `can_medicate`.

На пустом экране `app/(tabs)/birds.tsx` (нет добавленных птиц) и на карте `app/(tabs)/map.tsx` (нет созданных запросов) показывается онбординговая подсказка с эмодзи и инструкцией, как добавить птицу / создать запрос.

---

### Редактирование профиля (`/edit-profile`)

Форма с тремя полями: имя (текст), район (выпадающий список из `MOSCOW_DISTRICTS`), годы опыта (numeric-keyboard, 0–99). Кнопка «Сохранить» в шапке вызывает `setCurrentUser({ ...currentUser, name, district, experienceYears })` и возвращает на предыдущий экран. Открывается из `/settings` → «Редактировать профиль».

---

### Настройки (`/settings`)

#### Раздел «Внешний вид»

Переключатель темы с тремя опциями (активная отмечена галочкой):
- ☀️ **Светлая** — всегда светлая тема (по умолчанию)
- 🌙 **Тёмная** — всегда тёмная тема
- 📱 **Как в системе** — следует настройке ОС

Выбор сохраняется в AsyncStorage (`@pernatye_theme_mode`).

#### Раздел «Аккаунт и данные»

- **Редактировать профиль** — переход на `/edit-profile` (форма имя / район из `MOSCOW_DISTRICTS` / годы опыта; сохранение через `setCurrentUser`)
- **Уведомления** — заглушка (push-уведомления запланированы)
- **Конфиденциальность** — информационный алерт
- **Помощь и поддержка** — контакт Telegram-поддержки
- **О приложении** — версия и описание

Кнопка «Сбросить все данные» (красная) — удаляет всё из AsyncStorage и возвращает на онбординг.

---

## Компоненты

### `BirdSpeciesIcon`

Круглая фотография вида птицы. Использует `SPECIES_IMAGES` из `AppContext`.

```tsx
import { BirdSpeciesIcon } from '@/components/BirdSpeciesIcon';

<BirdSpeciesIcon species="parrot_budgie" size={32} />
<BirdSpeciesIcon species="canary" size={80} rounded={false} style={{ borderRadius: 12 }} />
```

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `species` | `BirdSpecies` | обязательный | Вид птицы |
| `size` | `number` | `24` | Размер в пикселях (ширина и высота) |
| `rounded` | `boolean` | `true` | Круглая форма (`borderRadius = size / 2`) |
| `style` | `ImageStyle?` | — | Дополнительные стили |

---

### `Avatar`

Аватар пользователя: инициалы на цветном фоне или фото.

```tsx
<Avatar name="Александр Иванов" size={44} />
<Avatar name="Марина С." photoUrl="https://..." size={64} />
```

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `name` | `string` | обязательный | Полное имя (для инициалов) |
| `photoUrl` | `string?` | — | URL фото |
| `size` | `number` | `40` | Диаметр в пикселях |

---

### `BirdCard`

Карточка птицы в двух режимах: полная и компактная.

```tsx
<BirdCard bird={bird} />
<BirdCard bird={bird} compact />
<BirdCard bird={bird} onPress={() => router.push('/bird/' + bird.id)} />
```

| Prop | Тип | Описание |
|------|-----|---------|
| `bird` | `Bird` | Объект птицы |
| `compact` | `boolean?` | Компактный вид (строчный) |
| `onPress` | `() => void?` | По умолчанию переходит на `/bird/[id]` |

В отсутствие `bird.photoUrl` показывает `BirdSpeciesIcon` с фотографией вида.

---

### `NeighborCard`

Карточка соседа-птичника для списка.

```tsx
<NeighborCard user={neighbor} />
```

| Prop | Тип | Описание |
|------|-----|---------|
| `user` | `User` | Объект пользователя-соседа |
| `onPress` | `() => void?` | По умолчанию переходит на `/neighbor/[id]` |

---

### `RatingStars`

Визуальный рейтинг звёздами.

```tsx
<RatingStars rating={4.8} />
<RatingStars rating={4.8} size={12} />
```

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `rating` | `number` | обязательный | Значение 0–5 |
| `size` | `number` | `14` | Размер звезды |

---

### `HelpStatusBadge`

Бейдж со статусом готовности помогать.

```tsx
<HelpStatusBadge status="ready" />
<HelpStatusBadge status="sometimes" size="sm" />
```

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `status` | `HelpStatus` | обязательный | Статус пользователя |
| `size` | `"sm" \| "md"` | `"md"` | Размер бейджа |

---

### `NativeMap`

Интерактивная карта на основе `react-native-webview` + Яндекс Maps JS API 2.1. Внутри `<WebView>` грузится HTML, в который сериализуются `region` и `markers`; скрипт `api-maps.yandex.ru/2.1/?apikey=…` создаёт `ymaps.Map`, расставляет `ymaps.Placemark` (зелёный для обычного, красный для `isSelected`) и шлёт нажатия наружу через `window.ReactNativeWebView.postMessage`. На стороне RN `onMessage` парсит JSON и вызывает `onMarkerPress(id)`.

API-ключ берётся из `process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY` (см. `.env` и переменные окружения на expo.dev). Отдельный config-plugin для `react-native-webview` не требуется (текущая версия `13.x` его не экспортирует), достаточно установленного npm-пакета.

```tsx
import NativeMap, { MarkerData, Region } from '@/components/NativeMap';

const region: Region = { latitude: 55.7558, longitude: 37.6173 };
const markers: MarkerData[] = neighbors
  .filter(n => n.lat && n.lng)
  .map(n => ({ id: n.id, latitude: n.lat!, longitude: n.lng!, title: n.name }));

<NativeMap
  region={region}
  markers={markers}
  onMarkerPress={(id) => router.push(`/neighbor/${id}`)}
/>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `region` | `Region` | Центр карты (`latitude`, `longitude`, опционально `latitudeDelta`/`longitudeDelta`). |
| `markers` | `MarkerData[]` | Массив маркеров (`id`, `latitude`, `longitude`, `title`, опционально `isSelected`, `markerColor`). |
| `onMarkerPress` | `(id: string) => void` | Вызывается при тапе на маркер, в качестве `id` приходит `MarkerData.id`. |

---

## Дизайн-система и темы

### Система тем

Управление темой реализовано через `context/ThemeContext.tsx`.

```tsx
// context/ThemeContext.tsx
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}
```

Хук `useColors()` читает выбранный режим из `ThemeContext`:
- `"light"` → всегда светлые токены
- `"dark"` → всегда тёмные токены
- `"system"` → `useColorScheme()` из React Native (берёт тему ОС)

По умолчанию при первом запуске тема — **светлая** (`"light"`).

### Цветовая палитра (Light)

| Токен | Значение | Назначение |
|-------|---------|-----------|
| `primary` | `#2d7d52` | Основной зелёный, кнопки, акценты |
| `background` | `#f8faf8` | Фон приложения |
| `card` | `#ffffff` | Фон карточек |
| `secondary` | `#e8f5ed` | Светло-зелёный фон чипов/иконок |
| `foreground` | `#1a1a2e` | Основной текст |
| `mutedForeground` | `#6b7c71` | Вторичный текст |
| `border` | `#dde8e2` | Разделители, рамки |
| `destructive` | `#e53935` | Удаление, ошибки |
| `star` | `#f59e0b` | Цвет звёзд рейтинга |
| `mapMarker` | `#2d7d52` | Обычный маркер на карте |
| `mapMarkerActive` | `#ff6b35` | Выбранный маркер |

В тёмной теме (`dark`) основной цвет сдвигается до `#4CAF82`, фон становится `#0d1f16`.

### Хук useColors()

```tsx
import { useColors } from '@/hooks/useColors';

function MyComponent() {
  const colors = useColors();
  return <View style={{ backgroundColor: colors.background }} />;
}
```

### Типографика

Шрифт **Inter** четырёх начертаний через `@expo-google-fonts/inter`:
- `Inter_400Regular`
- `Inter_500Medium`
- `Inter_600SemiBold`
- `Inter_700Bold`

Базовый радиус скруглений: `12px` (`colors.radius`).

---

## Мок-данные

Приложение не имеет бэкенда. Все данные соседей — мок-объекты в `AppContext.tsx`.

### Мок-птичники (20 штук)

Массив `MOCK_NEIGHBORS` в `context/AppContext.tsx`. Распределение по статусам: 12 «Готов», 5 «Иногда», 3 «Пока нет». У 6 соседей в профиле перечислены другие питомцы (`otherPets`).

| ID | Имя | Район | Опыт | Рейтинг | Статус | Другие питомцы |
|----|-----|-------|------|---------|--------|----------------|
| n1 | Алексей Морозов | Замоскворечье | 5 лет | 4.8 | Готов | Кошка |
| n2 | Марина Соколова | Арбат | 3 года | 4.9 | Готов | — |
| n3 | Дмитрий Лебедев | Хамовники | 8 лет | 4.6 | Иногда | Собака «Барон» |
| n4 | Екатерина Птицына | Пресненский | 2 года | 4.7 | Готов | — |
| n5 | Ирина Воробьёва | Таганский | 6 лет | 5.0 | Готов | — |
| n6 | Сергей Канарейкин | Басманный | 4 года | 4.4 | Иногда | — |
| n7 | Ольга Журавлёва | Бабушкинский | 7 лет | 4.9 | Готов | — |
| n8 | Андрей Стрижов | Сокол | 10 лет | 4.8 | Готов | Собака «Лорд» |
| n9 | Татьяна Голубева | Бибирево | 3 года | 4.7 | Готов | — |
| n10 | Игорь Снегирёв | Отрадное | 6 лет | 4.5 | Иногда | — |
| n11 | Наталья Ласточкина | Чертаново Северное | 5 лет | 4.9 | Готов | Кошка «Муся» |
| n12 | Михаил Орлов | Зюзино | 12 лет | 5.0 | Готов | — |
| n13 | Полина Чайкина | Южное Бутово | 1 год | 4.3 | Пока нет | — |
| n14 | Евгений Скворцов | Ясенево | 9 лет | 4.8 | Готов | Собака «Граф» |
| n15 | Юлия Зябликова | Измайлово | 4 года | 4.6 | Иногда | — |
| n16 | Артём Дятлов | Перово | 8 лет | 4.9 | Готов | — |
| n17 | Светлана Соловьёва | Кунцево | 11 лет | 5.0 | Готов | — |
| n18 | Виктор Грачёв | Раменки | 2 года | 4.2 | Пока нет | — |
| n19 | Анна Иволгина | Митино | 6 лет | 4.7 | Иногда | Кошка «Пушок» |
| n20 | Кирилл Филин | Тропарёво-Никулино | 3 года | 4.4 | Пока нет | — |

Координаты (lat/lng) у всех соседей заданы вручную и охватывают центральные, северные, восточные, южные и западные районы Москвы.

### Мок-статьи (5 штук)

Определены прямо в `app/(tabs)/feed.tsx` как константа `ARTICLES`.

### Мок-отзывы и птицы соседей

Определены в `app/neighbor/[id].tsx` как `MOCK_REVIEWS` и `MOCK_USER_BIRDS`.

- `MOCK_REVIEWS` — отзывы есть для всех 20 соседей (n1–n20), по 2–4 отзыва каждому.
- `MOCK_USER_BIRDS` — карточки птиц заполнены **для всех 20 соседей** (n1–n20); виды синхронизированы с `app/(tabs)/map.tsx → MOCK_USER_BIRDS`. Для соседей n1–n6 — несколько птиц с подробной информацией; для n7–n20 — по одной птице на каждого. Половина новых птиц (n7, n9, n11, n13, n15, n17, n19) имеют поля `wasExamined / vetName / lastCheckupDate`, чтобы демонстрировать бейдж «Осмотрена ветеринаром».

---

## Известные ограничения и Roadmap

### Текущие ограничения

| Ограничение | Описание |
|------------|---------|
| Нет бэкенда | Все данные хранятся локально, не синхронизируются между устройствами |
| Мок-соседи | 20 соседей захардкожены, нельзя зарегистрироваться как сосед извне |
| Telegram Auth | Реального OAuth нет — только ввод имени |
| Геолокация | Карта центрирована на Москве, реальное местоположение не используется |
| Нет push-уведомлений | Запросы не уведомляют другую сторону |
| Нет чата | Общение только через внешний Telegram |
| Вложения | Файлы хранятся как локальные URI — не сохранятся после переустановки |

### Известные баги

Полный список — в `QA_REPORT.md` (раздел «Сводный список проблем»). После раунда фиксов от 25 апреля 2026 г.:

🔴 **Критично** — закрыто

- ✅ В профиле соседей `n7`–`n20` теперь есть птицы — `MOCK_USER_BIRDS` покрывает все 20 соседей.
- ✅ Реализован экран `app/edit-bird/[id].tsx` (полная копия `add-bird` с предзаполненными значениями); кнопка «Редактировать» в шапке `app/bird/[id].tsx` снова активна.

🟠 **Важно** — закрыто

- ✅ Добавлен экран `app/edit-profile.tsx` (имя / район / годы опыта), кнопка в настройках ведёт туда.
- ✅ Кнопка Telegram теперь открывает `tg://resolve?domain=...` с фолбэком на `https://t.me/...` через `Linking.canOpenURL`.
- ✅ `app/index.tsx` показывает `null` пока идёт загрузка AsyncStorage (флаг `isLoading` в `AppContext`), затем редиректит на `/onboarding` или `/(tabs)/map`. Flicker карты ушёл.
- ✅ Убрана тавтология статуса в `app/new-request.tsx` (`status: "open"` без тернарника).

🟢 **Незначительно**

- ✅ Оба предупреждения typecheck исправлены (`hooks/useColors.ts` упрощён, `bird/[id].tsx` больше не пушит несуществующий маршрут).
- Заглушки «Уведомления» и «Конфиденциальность» в настройках — без изменений (отложено).
- Хардкод выделенной статьи «Популярное» в `app/(tabs)/feed.tsx` — без изменений (отложено).

### Roadmap

1. **Реальный бэкенд** — REST API (Express/Node.js) + PostgreSQL, хранение пользователей, птиц, запросов и отзывов.
2. **Telegram OAuth** — настоящая авторизация через Telegram Login Widget или Bot API.
3. **Push-уведомления** — expo-notifications: новые запросы, ответы, сообщения.
4. **Геолокация** — определение района пользователя через expo-location, поиск соседей по радиусу, реальный расчёт расстояния до соседа.
5. **Облачное хранилище фото** — фото птиц сейчас сохраняются как локальный URI (`expo-image-picker`); нужно загружать на сервер, чтобы они переживали переустановку.
6. **Реальные отзывы** — создание и хранение отзывов на бэкенде, пересчёт рейтинга.
7. **Чат** — встроенный мессенджер или Bot API интеграция.
8. **Поиск по всей России** — расширение за пределы Москвы.
9. **Облачные вложения** — хранение файлов (ветеринарных документов) на сервере.
