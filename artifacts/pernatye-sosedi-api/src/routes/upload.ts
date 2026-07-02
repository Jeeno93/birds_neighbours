import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";

/**
 * Загрузка фото (птицы, аватары) в персистентное хранилище.
 *
 * Файлы кладём на постоянный том Amvera (`/data`, см. amvera.yml →
 * persistentStorage), чтобы они переживали редеплой. Раньше приложение
 * хранило локальный `file://` URI — он терялся при переустановке и был
 * не виден другим устройствам вовсе.
 */

// Куда писать файлы. На Amvera — /data/uploads (персистентный том),
// локально — ./uploads в рабочей директории.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// База для публичного URL картинки. На проде задать домен API Amvera
// (за прокси req.protocol может быть http). Пусто → строим из запроса.
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] || ".jpg";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 МБ
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) cb(null, true);
    else cb(new Error("UNSUPPORTED_TYPE"));
  },
});

const router = Router();

// POST /api/upload — multipart, поле "file". Требует x-user-id.
router.post("/", requireAuth, (req: Request, res: Response) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Файл слишком большой (макс 6 МБ)"
          : err.message === "UNSUPPORTED_TYPE"
          ? "Поддерживаются только JPEG, PNG, WebP"
          : "Не удалось загрузить файл";
      res.status(400).json({ error: msg });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Файл не передан" });
      return;
    }
    const base = PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    res.status(201).json({ url: `${base}/uploads/${req.file.filename}` });
  });
});

export default router;
