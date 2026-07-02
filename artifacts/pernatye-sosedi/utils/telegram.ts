/**
 * Утилиты для Telegram-хендлов.
 *
 * Контакт с соседом — момент конверсии всего продукта, а `telegram_id`
 * исторически вводился как свободная строка без проверки. В базе из-за этого
 * есть битые значения (email вместо username, синтетические `tg_<timestamp>`),
 * по которым ссылка `t.me/<...>` не открывается. Эти функции нормализуют ввод,
 * валидируют по правилам Telegram и дают безопасную ссылку.
 */

/** Правило Telegram: 5–32 символа, [A-Za-z0-9_], начинается с буквы. */
const TELEGRAM_USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

/**
 * Приводит любой ввод к «голому» username: убирает пробелы, ведущий `@`,
 * префиксы ссылок (`https://t.me/`, `t.me/`, `tg://resolve?domain=`) и все
 * недопустимые символы. Не гарантирует валидность — только чистит форму.
 */
export function normalizeTelegramUsername(raw: string): string {
  return (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^tg:\/\/resolve\?domain=/i, "")
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9_]/g, "");
}

/** Проверяет уже нормализованный хендл по правилам Telegram. */
export function isValidTelegramUsername(handle: string | null | undefined): boolean {
  if (!handle) return false;
  return TELEGRAM_USERNAME_RE.test(handle);
}

/**
 * Синтетический id вида `tg_<timestamp>` — генерился онбордингом при пустом
 * вводе. Формально проходит regex (начинается с `t`), поэтому отсекаем отдельно.
 */
export function isSyntheticTelegramId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("tg_");
}

/** Пригодный для контакта хендл: валиден и не синтетический. */
export function isContactableTelegram(id: string | null | undefined): boolean {
  return isValidTelegramUsername(id) && !isSyntheticTelegramId(id);
}

/** Веб-ссылка на профиль Telegram по хендлу (хендл нормализуется). */
export function telegramWebUrl(handle: string): string {
  return `https://t.me/${normalizeTelegramUsername(handle)}`;
}

/** Deep-link для нативного приложения Telegram. */
export function telegramDeepLink(handle: string): string {
  return `tg://resolve?domain=${normalizeTelegramUsername(handle)}`;
}
