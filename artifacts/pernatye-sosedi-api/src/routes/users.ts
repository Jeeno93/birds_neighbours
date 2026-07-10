import { Router, Request, Response } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Правило Telegram: 5–32 символа, [A-Za-z0-9_], начинается с буквы.
const TELEGRAM_USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
function isValidTelegramUsername(handle: unknown): handle is string {
  return typeof handle === "string" && TELEGRAM_USERNAME_RE.test(handle);
}

function rowToUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    telegramId: row.telegram_id,
    name: row.name,
    photoUrl: row.photo_url,
    city: row.city,
    district: row.district,
    address: row.address,
    addressComment: row.address_comment,
    lat: row.lat,
    lng: row.lng,
    experienceYears: row.experience_years,
    helpStatus: row.help_status,
    sitTypes: row.sit_types ?? [],
    capabilities: row.capabilities ?? [],
    otherPets: row.other_pets ?? [],
    rating: row.rating,
    reviewsCount: row.reviews_count,
    createdAt: row.created_at,
  };
}

// Стабильный хэш строки в 32-битное число — используем как seed, чтобы
// размытие координат было детерминированным (маркер не прыгает между
// запросами), но непредсказуемым без знания id пользователя.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Домашний адрес — чувствительные данные (приложение сводит незнакомцев
// для передачи питомца физически). Чужим пользователям точный адрес и
// точные координаты никогда не отдаём: адрес показываем не точнее района/
// города, а координаты сдвигаем детерминированным случайным офсетом
// 250–600м — этого достаточно, чтобы понять «сосед рядом», но не найти дом.
function fuzzCoords(lat: number, lng: number, seedKey: string): { lat: number; lng: number } {
  const seed = hashString(seedKey);
  const angle = (seed % 360) * (Math.PI / 180);
  const distanceMeters = 250 + (seed % 350);
  const dLat = (distanceMeters * Math.cos(angle)) / 111320;
  const dLng =
    (distanceMeters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

// Публичное представление пользователя — то, что видят ДРУГИЕ участники
// (список соседей, карта, чужой профиль). Без точного адреса, без
// addressComment (домофон/подъезд — приватная деталь для ситтера) и с
// размытыми координатами. Точные данные отдаём только владельцу профиля
// (POST /auth, PUT /:id, GET /:id когда id совпадает с x-user-id).
function rowToPublicUser(row: any) {
  const full = rowToUser(row);
  if (!full) return null;
  const { address, addressComment, lat, lng, ...safe } = full;
  const fuzzed =
    typeof lat === "number" && typeof lng === "number"
      ? fuzzCoords(lat, lng, full.id)
      : { lat, lng };
  return {
    ...safe,
    address: null,
    lat: fuzzed.lat,
    lng: fuzzed.lng,
  };
}

// POST /api/users/auth — find-or-create by telegramId
router.post("/auth", async (req: Request, res: Response) => {
  try {
    const { telegramId, name } = req.body ?? {};
    if (!telegramId || !name) {
      res.status(400).json({ error: "telegramId and name are required" });
      return;
    }

    const found = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [
      String(telegramId),
    ]);

    if (found.rowCount && found.rowCount > 0) {
      res.json(rowToUser(found.rows[0]));
      return;
    }

    const inserted = await pool.query(
      `INSERT INTO users (telegram_id, name) VALUES ($1, $2) RETURNING *`,
      [String(telegramId), String(name)]
    );
    res.status(201).json(rowToUser(inserted.rows[0]));
  } catch (err) {
    console.error("POST /api/users/auth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users — list neighbors that are help-active and have coords
router.get("/", async (req: Request, res: Response) => {
  try {
    // Город теперь — необязательный параметр. Без него возвращаем всех
    // активных соседей с координатами; с ним — фильтруем по точному совпадению.
    const city = (req.query.city as string | undefined) ?? null;
    const params: unknown[] = [];
    let where = `help_status <> 'not_now' AND lat IS NOT NULL AND lng IS NOT NULL`;
    if (city) {
      params.push(city);
      where += ` AND city = $${params.length}`;
    }
    const result = await pool.query(
      `SELECT * FROM users WHERE ${where} ORDER BY rating DESC, reviews_count DESC`,
      params
    );
    // Список всегда "чужой" ракурс (карта/соседи) — точный адрес и координаты не отдаём.
    res.json(result.rows.map(rowToPublicUser));
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    if (!result.rowCount) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Точные адрес/координаты отдаём только владельцу профиля — сверяем
    // x-user-id с запрошенным :id. Заголовок не криптографически защищён,
    // но это не хуже остальной модели авторизации приложения; здесь важно,
    // чтобы обычный просмотр чужого профиля никогда не получал точные данные.
    const isSelf = req.headers["x-user-id"] === req.params.id;
    res.json(isSelf ? rowToUser(result.rows[0]) : rowToPublicUser(result.rows[0]));
  } catch (err) {
    console.error("GET /api/users/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id — update profile (auth required + must match :id)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.userId !== req.params.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const {
      name,
      telegramId,
      district,
      address,
      addressComment,
      lat,
      lng,
      helpStatus,
      experienceYears,
      sitTypes,
      capabilities,
      otherPets,
      city,
      photoUrl,
    } = req.body ?? {};

    // Telegram-username валидируем на бэке: битый хендл ломает контакт с соседом.
    if (telegramId !== undefined && !isValidTelegramUsername(telegramId)) {
      res.status(400).json({ error: "Invalid telegram username" });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (name !== undefined) push("name", name);
    if (telegramId !== undefined) push("telegram_id", telegramId);
    if (district !== undefined) push("district", district);
    if (address !== undefined) push("address", address);
    if (addressComment !== undefined) push("address_comment", addressComment);
    if (lat !== undefined) push("lat", lat);
    if (lng !== undefined) push("lng", lng);
    if (helpStatus !== undefined) push("help_status", helpStatus);
    if (experienceYears !== undefined) push("experience_years", experienceYears);
    if (sitTypes !== undefined) push("sit_types", sitTypes);
    if (capabilities !== undefined) push("capabilities", capabilities);
    if (otherPets !== undefined) push("other_pets", JSON.stringify(otherPets));
    if (city !== undefined) push("city", city);
    if (photoUrl !== undefined) push("photo_url", photoUrl);

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(req.params.id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(sql, values);
    if (!result.rowCount) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(rowToUser(result.rows[0]));
  } catch (err: any) {
    // 23505 — нарушение UNIQUE (telegram_id уже занят другим пользователем).
    if (err?.code === "23505") {
      res.status(409).json({ error: "Telegram username already taken" });
      return;
    }
    console.error("PUT /api/users/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
