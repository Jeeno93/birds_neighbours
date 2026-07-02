import { BASE_URL } from "@/api/client";

/**
 * Загружает локальную картинку (uri из expo-image-picker) на бэкенд и
 * возвращает публичный https-URL. Раньше в photoUrl клали локальный
 * `file://` uri — он терялся при переустановке и был не виден другим
 * устройствам. Теперь храним ссылку на файл в персистентном хранилище.
 */
export async function uploadImageAsync(
  localUri: string,
  userId: string,
  mimeType?: string
): Promise<string> {
  const name = localUri.split("/").pop() || `photo_${Date.now()}.jpg`;
  const ext = (/\.(\w+)$/.exec(name)?.[1] || "jpg").toLowerCase();
  const type =
    mimeType ||
    (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");

  const form = new FormData();
  // В React Native FormData принимает объект { uri, name, type }.
  form.append("file", { uri: localUri, name, type } as any);

  // Content-Type не выставляем вручную — fetch сам добавит boundary.
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Ошибка загрузки (${res.status})`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
