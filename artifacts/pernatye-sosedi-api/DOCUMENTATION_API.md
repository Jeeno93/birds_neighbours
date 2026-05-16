# Pernatye Sosedi API

REST API бэкенд для приложения «Пернатые соседи». Развёртывается на Amvera, БД — PostgreSQL (Amvera CNPG).

## Стек

- Node.js 20, TypeScript 5.3 (strict, CommonJS)
- Express 4
- pg (raw PostgreSQL, без ORM)
- dotenv, cors

## Структура

```
artifacts/pernatye-sosedi-api/
├── src/
│   ├── index.ts                # bootstrap, CORS, JSON, монтирование роутеров, /health
│   ├── db.ts                   # pg Pool, читает DATABASE_URL из .env
│   ├── routes/
│   │   ├── users.ts            # /api/users/*
│   │   ├── birds.ts            # /api/birds/*
│   │   ├── requests.ts         # /api/sit-requests/*
│   │   └── reviews.ts          # /api/reviews/*
│   └── middleware/
│       └── auth.ts             # requireAuth — проверка заголовка x-user-id
├── migrations/
│   └── 001_init.sql            # CREATE TABLE users / birds / sit_requests / reviews
├── amvera.yml                  # манифест деплоя на Amvera
├── tsconfig.json               # target ES2020, outDir dist
├── package.json
├── .env.example
└── DOCUMENTATION_API.md
```

## Авторизация

Простая схема: каждый запрос, изменяющий данные, должен содержать заголовок `x-user-id: <UUID>`. Middleware `requireAuth` кладёт его в `req.userId`. Где требуется владение — отдельно проверяется, что `req.userId === user_id` ресурса (либо `:id` для `/users/:id`).

Формат входящих/исходящих данных — `camelCase`. Внутри БД — `snake_case`; преобразование делают функции `rowToUser` / `rowToBird` / `rowToRequest` / `rowToReview` в каждом роуте.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | строка подключения к PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `PORT` | порт HTTP-сервера (по умолчанию 80, локально удобно 3000) |
| `NODE_ENV` | `development` / `production` |

## Endpoints

### Health

- `GET /health` → `{ "status": "ok" }`

### Users — `/api/users`

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| POST | `/api/users/auth` | — | Тело: `{ telegramId, name }`. Find-or-create по `telegram_id`. Возвращает пользователя (201 если создан, 200 если уже был). |
| GET | `/api/users?city=<имя>` | — | Список соседей: `help_status <> 'not_now'` И заполнены `lat`/`lng`. `city` — опционально; без него возвращаются соседи из всех городов. |
| GET | `/api/users/:id` | — | Одного пользователя. 404 если нет. |
| PUT | `/api/users/:id` | `x-user-id` == `:id` | Обновить профиль: `name, city, district, address, addressComment, lat, lng, helpStatus, experienceYears, sitTypes, capabilities, otherPets, photoUrl`. Обновляются только переданные поля. 403 если `x-user-id` не совпадает с `:id`. |

### Birds — `/api/birds`

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| GET | `/api/birds?userId=<uuid>` | опционально `x-user-id` | Птицы пользователя, отсортированы по `created_at`. Если `x-user-id` совпадает с `userId` — возвращаются все птицы; иначе — только публичные (`is_public IS TRUE` либо `NULL` для старых записей). |
| POST | `/api/birds` | `x-user-id` | Создать птицу. Обязательно: `species`, `name`. Прочее — опционально, включая `isPublic` (по умолчанию `true`). `userId` берётся из заголовка. |
| PUT | `/api/birds/:id` | `x-user-id` == `birds.user_id` | Частичное обновление по camelCase ключам (`species, name, photoUrl, ageMonths, food, schedule, diseases, medications, catchNotes, vetNotes, sitLocation, wasExamined, vetName, vetContact, lastCheckupDate, medicationExperience, isPublic`). 403 если птица не своя. |
| DELETE | `/api/birds/:id` | `x-user-id` == `birds.user_id` | Удалить. 204. |

### Sit Requests — `/api/sit-requests`

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| GET | `/api/sit-requests?userId=<uuid>` | — | Запросы пользователя, новые сверху. |
| POST | `/api/sit-requests` | `x-user-id` | Создать. Обязательно: `dateFrom`, `dateTo`. Поля: `birds (jsonb), sitType, dateFrom, dateTo, district, comment, status`. По умолчанию `status='open'`, `sitType='full'`. |
| PUT | `/api/sit-requests/:id` | `x-user-id` == владелец | Частичное обновление. `birds` сериализуется в JSON. |
| PUT | `/api/sit-requests/:id/status` | `x-user-id` == владелец | Тело `{ status }` — обновить только статус (`open` / `matched` / `closed`). |

### Reviews — `/api/reviews`

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| GET | `/api/reviews?toUserId=<uuid>` | — | Отзывы о пользователе. |
| POST | `/api/reviews` | `x-user-id` | Создать отзыв. Тело: `{ toUserId, tags?: string[], comment?: string, rating: 1..5 }`. `from_user_id` берётся из заголовка. После INSERT транзакционно пересчитывается `users.rating` (AVG) и `users.reviews_count` (COUNT). |

## Схема БД

См. `migrations/001_init.sql`. Кратко:

- **users** — `id, telegram_id (UNIQUE), name, photo_url, city, district, address, address_comment, lat, lng, experience_years, help_status, sit_types[], capabilities[], other_pets (jsonb), rating, reviews_count, created_at`.
- **birds** — `id, user_id (FK→users on delete cascade), species, name, photo_url, age_months, food, schedule, diseases[], medications, catch_notes, vet_notes, sit_location, was_examined, vet_name, vet_contact, last_checkup_date, medication_experience, is_public (default true), created_at`.
- **sit_requests** — `id, user_id (FK→users on delete cascade), birds (jsonb), sit_type, date_from, date_to, district, comment, status, created_at`.
- **reviews** — `id, from_user_id (FK→users), to_user_id (FK→users), tags[], comment, rating, created_at`.

Индексы: `birds(user_id)`, `sit_requests(user_id)`, `reviews(to_user_id)`, `users(telegram_id)`.

UUID генерируется расширением `pgcrypto` (`gen_random_uuid()`).

## Локальный запуск

```bash
# 1) положить .env (см. .env.example) рядом с package.json
cp artifacts/pernatye-sosedi-api/.env.example artifacts/pernatye-sosedi-api/.env
# отредактировать DATABASE_URL и PORT

# 2) применить миграции (любым psql-клиентом)
psql "$DATABASE_URL" -f artifacts/pernatye-sosedi-api/migrations/001_init.sql

# 3) запустить dev-сервер (через корневой скрипт)
pnpm run api
# или
pnpm --filter pernatye-sosedi-api run dev
```

Этот пакет — часть pnpm-workspace, но он самодостаточен (свои `dependencies`, без `catalog:` и без `@workspace/*`-связей). Это сделано специально: на Amvera пакет деплоится отдельно через `npm install` + `npm run build`.

## Деплой на Amvera

1. Подготовить PostgreSQL-кластер на Amvera (CNPG), создать БД `pernatye_sosedi` и пользователя `pernatye_user`.
2. Применить `migrations/001_init.sql` к этой БД.
3. В настройках приложения Amvera задать переменную окружения `DATABASE_URL` со строкой подключения к внутреннему хосту (`amvera-...-cnpg-...-rw:5432`). `PORT` Amvera ставит в `80` сам — не задавайте вручную.
4. В корне репозитория должен лежать `amvera.yml` (для этого приложения он находится в `artifacts/pernatye-sosedi-api/amvera.yml` — поместите его в корень либо настройте `buildDirectory` в Amvera-проекте на эту папку).
5. Деплой: `git push amvera master` (Amvera выполнит `npm install` → `npm run build` → `node dist/index.js`).
6. Проверка: `curl https://<your-app>.amvera.io/health` → `{"status":"ok"}`.

### amvera.yml

```yaml
meta:
  environment: nodejs
  toolVersion: "20"
build:
  installDependencies: true
  buildDirectory: artifacts/pernatye-sosedi-api
  buildCommand: npm run build
run:
  runCommand: node dist/index.js
  persistentStorage:
    - /data
```

## Коды ответов

- `200 OK` — успех (GET, PUT)
- `201 Created` — создан ресурс (POST)
- `204 No Content` — DELETE
- `400 Bad Request` — невалидное тело / отсутствуют обязательные поля
- `401 Unauthorized` — нет заголовка `x-user-id`
- `403 Forbidden` — нет прав на ресурс
- `404 Not Found` — ресурс не найден
- `500 Internal Server Error` — ошибка сервера (см. логи)
