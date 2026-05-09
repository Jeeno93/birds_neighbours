const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://pernatysosedi-api-almazkin93.amvera.io";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  userId?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
    ...(userId ? { "x-user-id": userId } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export { BASE_URL };
